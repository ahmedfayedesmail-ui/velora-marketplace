-- Velora Restore-Test only.
-- Cancelled pre-payment orders must not consume a platform-promotion usage slot.
-- Reuse the existing promotion_redemptions ledger and promotion used_count.

create or replace function public.velora_cancel_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_customer uuid := auth.uid();
  v_order record;
  v_item record;

  v_gift_card public.gift_cards%rowtype;
  v_gc_refund numeric(18,4) := 0;
  v_gc_balance_after numeric(18,4);
  v_gc_refund_exists boolean := false;

  v_coupon_id uuid;
  v_coupon_code text;
  v_coupon_discount numeric(18,4) := 0;

  v_promotion_id uuid;
  v_promotion_code text;
  v_promotion_discount numeric(18,4) := 0;
begin
  if v_customer is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into v_order
  from public.orders
  where id=p_order_id
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.customer_id<>v_customer then raise exception 'NOT_ORDER_OWNER'; end if;
  if v_order.payment_status::text<>'pending' then raise exception 'ORDER_NOT_CANCELLABLE'; end if;
  if v_order.status::text not in ('pending','confirmed') then raise exception 'ORDER_NOT_CANCELLABLE'; end if;

  if v_order.gift_card_id is not null
     and coalesce(v_order.gift_card_amount,0)>0 then

    select * into v_gift_card
    from public.gift_cards
    where id=v_order.gift_card_id
    for update;

    if not found then raise exception 'GIFT_CARD_NOT_FOUND'; end if;

    select exists(
      select 1
      from public.gift_card_transactions gct
      where gct.gift_card_id=v_gift_card.id
        and gct.order_id=v_order.id
        and gct.transaction_type='refund'
        and gct.idempotency_key='cancel:'||v_order.id::text
    ) into v_gc_refund_exists;

    if not v_gc_refund_exists then
      v_gc_refund:=greatest(0,least(coalesce(v_order.gift_card_amount,0),coalesce(v_order.gift_card_amount,0)));
      if v_gc_refund>0 then
        v_gc_balance_after:=v_gift_card.balance_amount+v_gc_refund;

        insert into public.gift_card_transactions(
          gift_card_id,customer_id,order_id,transaction_type,amount,balance_after,
          idempotency_key,metadata,created_at
        )
        values(
          v_gift_card.id,v_order.customer_id,v_order.id,'refund',v_gc_refund,
          v_gc_balance_after,'cancel:'||v_order.id::text,
          jsonb_build_object(
            'reason','order_cancelled_before_payment_settlement',
            'currency_code',v_gift_card.currency_code,
            'previous_order_gift_card_amount',v_order.gift_card_amount
          ),
          now()
        );

        update public.gift_cards
        set balance_amount=v_gc_balance_after,
            status=case
              when expires_at is not null and expires_at<=now() then 'expired'
              else 'active'
            end,
            updated_at=now()
        where id=v_gift_card.id;

        insert into public.payments(order_id,provider,amount,currency,status,method)
        values(v_order.id,'velora_gift_card',v_gc_refund,v_order.currency,'refunded','gift_card_refund');

        insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
        values(
          v_customer,'gift_card_refunded_on_order_cancellation','order',v_order.id,
          jsonb_build_object(
            'gift_card_id',v_gift_card.id,
            'refund_amount',v_gc_refund,
            'currency_code',v_gift_card.currency_code,
            'idempotency_key','cancel:'||v_order.id::text
          )
        );
      end if;
    end if;
  end if;

  select c.id,c.code,cr.discount_amount
    into v_coupon_id,v_coupon_code,v_coupon_discount
  from public.coupon_redemptions cr
  join public.coupons c on c.id=cr.coupon_id
  where cr.order_id=v_order.id
    and cr.customer_id=v_order.customer_id
  order by cr.created_at
  limit 1
  for update;

  if v_coupon_id is not null then
    delete from public.coupon_redemptions
    where coupon_id=v_coupon_id
      and order_id=v_order.id
      and customer_id=v_order.customer_id;

    update public.coupons
    set used_count=greatest(0,used_count-1),
        updated_at=now()
    where id=v_coupon_id;

    insert into public.audit_logs(
      actor_id,action,entity_type,entity_id,metadata
    )
    values(
      v_customer,
      'coupon_released_on_order_cancellation',
      'order',
      v_order.id,
      jsonb_build_object(
        'coupon_id',v_coupon_id,
        'coupon_code',v_coupon_code,
        'discount_amount',v_coupon_discount
      )
    );
  end if;

  select pr.promotion_id,pr.discount_amount
    into v_promotion_id,v_promotion_discount
  from public.promotion_redemptions pr
  where pr.order_id=v_order.id
    and pr.customer_id=v_order.customer_id
  order by pr.created_at
  limit 1
  for update;

  if v_promotion_id is not null then
    select code into v_promotion_code
    from public.promotions
    where id=v_promotion_id
    for update;

    delete from public.promotion_redemptions
    where promotion_id=v_promotion_id
      and order_id=v_order.id
      and customer_id=v_order.customer_id;

    update public.promotions
    set used_count=greatest(0,used_count-1),
        updated_at=now()
    where id=v_promotion_id;

    insert into public.audit_logs(
      actor_id,action,entity_type,entity_id,metadata
    )
    values(
      v_customer,
      'promotion_released_on_order_cancellation',
      'order',
      v_order.id,
      jsonb_build_object(
        'promotion_id',v_promotion_id,
        'promotion_code',v_promotion_code,
        'discount_amount',v_promotion_discount
      )
    );
  end if;

  for v_item in
    select oi.* from public.order_items oi where oi.order_id=p_order_id for update
  loop
    if v_item.product_id is not null then
      if v_item.product_variant_id is not null then
        update public.product_variants
        set stock_quantity=stock_quantity+v_item.quantity,
            updated_at=now()
        where id=v_item.product_variant_id;
        if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
      end if;

      update public.products
      set stock=stock+v_item.quantity,
          updated_at=now()
      where id=v_item.product_id;
      if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    end if;

    update public.commissions
    set status='reversed'
    where order_item_id=v_item.id and status='pending';
  end loop;

  update public.orders
  set status='cancelled',
      payment_status='cancelled',
      updated_at=now()
  where id=p_order_id;

  update public.payments
  set status='cancelled',
      updated_at=now()
  where order_id=p_order_id
    and status='pending';

  insert into public.audit_logs(
    actor_id,action,entity_type,entity_id,metadata
  )
  values(
    v_customer,'order_cancelled','order',p_order_id,
    jsonb_build_object(
      'restocked',true,
      'gift_card_refunded',v_gc_refund>0,
      'coupon_released',v_coupon_id is not null,
      'promotion_released',v_promotion_id is not null
    )
  );

  return jsonb_build_object(
    'ok',true,
    'order_id',p_order_id,
    'status','cancelled',
    'gift_card_refunded',v_gc_refund>0,
    'gift_card_refund_amount',v_gc_refund,
    'coupon_released',v_coupon_id is not null,
    'promotion_released',v_promotion_id is not null
  );
end;
$function$;

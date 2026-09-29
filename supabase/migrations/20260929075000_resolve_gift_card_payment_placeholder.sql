-- Velora Restore-Test only.
-- Keep the payment ledger coherent when a gift card changes the final order
-- total. Full gift-card coverage must cancel the pre-commercial pending
-- placeholder because placeOrder() exits before payment-method selection.

create or replace function public.velora_apply_gift_card_to_order(
  p_order_id uuid,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_order public.orders%rowtype;
  v_card public.gift_cards%rowtype;
  v_code text:=upper(trim(coalesce(p_code,'')));
  v_apply numeric;
  v_new_total numeric;
  v_key text;
begin
  perform public.velora_assert_legal_acceptance(
    array['terms_of_service','privacy_policy','gift_card_terms']
  );

  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_order_id is null or v_code='' then raise exception 'GIFT_CARD_IDENTIFIERS_REQUIRED'; end if;

  select * into v_order
  from public.orders
  where id=p_order_id and customer_id=v_uid
  for update;

  if not found then raise exception 'ORDER_NOT_FOUND'; end if;

  select * into v_card
  from public.gift_cards
  where code=v_code
  for update;

  if not found then raise exception 'GIFT_CARD_NOT_FOUND'; end if;

  if exists(
    select 1
    from public.gift_card_transactions
    where gift_card_id=v_card.id
      and order_id=v_order.id
      and transaction_type='redeem'
  ) then
    return jsonb_build_object(
      'ok',true,
      'reused',true,
      'order_id',v_order.id,
      'gift_card_id',v_card.id,
      'code',v_card.code,
      'applied_amount',coalesce(v_order.gift_card_amount,0),
      'balance_amount',v_card.balance_amount,
      'total',v_order.total
    );
  end if;

  if v_card.status<>'active' then raise exception 'GIFT_CARD_NOT_ACTIVE'; end if;

  if v_card.expires_at is not null and v_card.expires_at<=now() then
    update public.gift_cards
    set status='expired',updated_at=now()
    where id=v_card.id;
    raise exception 'GIFT_CARD_EXPIRED';
  end if;

  if v_card.currency_code<>upper(v_order.currency) then
    raise exception 'GIFT_CARD_CURRENCY_MISMATCH';
  end if;

  v_apply:=least(v_card.balance_amount,v_order.total);
  if v_apply<=0 then raise exception 'GIFT_CARD_NO_BALANCE_OR_ORDER_PAID'; end if;

  v_new_total:=greatest(0,round(v_order.total-v_apply,4));
  v_key:='redeem:'||v_order.id::text;

  update public.orders
  set gift_card_id=v_card.id,
      gift_card_amount=coalesce(gift_card_amount,0)+v_apply,
      total=v_new_total,
      payment_status=case
        when v_new_total=0 then 'paid'::public.payment_status
        else payment_status
      end,
      updated_at=now()
  where id=v_order.id;

  insert into public.gift_card_transactions(
    gift_card_id,
    customer_id,
    order_id,
    transaction_type,
    amount,
    balance_after,
    idempotency_key,
    metadata,
    created_at
  )
  values(
    v_card.id,
    v_uid,
    v_order.id,
    'redeem',
    -v_apply,
    v_card.balance_amount-v_apply,
    v_key,
    jsonb_build_object(
      'currency_code',v_order.currency,
      'previous_order_total',v_order.total
    ),
    now()
  );

  update public.gift_cards
  set balance_amount=balance_amount-v_apply,
      status=case
        when balance_amount-v_apply<=0 then 'exhausted'
        else 'active'
      end,
      updated_at=now()
  where id=v_card.id;

  insert into public.payments(
    order_id,provider,amount,currency,status,method
  )
  values(
    v_order.id,
    'velora_gift_card',
    v_apply,
    v_order.currency,
    'paid',
    'gift_card'
  );

  if v_new_total=0 then
    update public.payments
    set status='cancelled',
        updated_at=now()
    where order_id=v_order.id
      and status='pending';
  else
    update public.payments
    set amount=v_new_total,
        currency=v_order.currency,
        updated_at=now()
    where order_id=v_order.id
      and status='pending';
  end if;

  insert into public.audit_logs(
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values(
    v_uid,
    'gift_card_redeemed',
    'order',
    v_order.id,
    jsonb_build_object(
      'gift_card_id',v_card.id,
      'applied_amount',v_apply,
      'currency_code',v_order.currency,
      'remaining_order_amount',v_new_total,
      'pending_payment_placeholder_resolved',true,
      'pending_payment_placeholder_resolution',
        case when v_new_total=0 then 'cancelled' else 'amount_synced' end
    )
  );

  return jsonb_build_object(
    'ok',true,
    'reused',false,
    'order_id',v_order.id,
    'gift_card_id',v_card.id,
    'code',v_card.code,
    'applied_amount',v_apply,
    'balance_amount',v_card.balance_amount-v_apply,
    'total',v_new_total
  );
end;
$function$;

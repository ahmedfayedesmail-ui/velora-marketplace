-- Restore-Test source provenance reconstruction.
-- This migration version is already applied in Restore-Test.
-- Effective runtime was verified from PostgreSQL. Historical byte identity is not claimed.
-- Production remains FROZEN.
--
-- Keep product aggregate stock and variant stock consistent across checkout/cancellation.
-- Variant checkout decrements both the selected variant and the parent product aggregate.
-- Variant cancellation restores both. Base-product checkout/cancellation remains unchanged.
create or replace function public.velora_create_order(
  p_items jsonb,
  p_currency text default null,
  p_shipping numeric default 0,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_customer_email text default null,
  p_customer_city text default null,
  p_customer_address text default null,
  p_customer_notes text default null,
  p_checkout_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_customer uuid:=auth.uid();
  v_order_id uuid;
  v_order_number bigint;
  v_existing_currency text;
  v_subtotal numeric(18,4):=0;
  v_total numeric(18,4):=0;
  v_shipping numeric(18,4):=0;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_product record;
  v_variant record;
  v_commission_rate numeric(7,4);
  v_fx numeric(24,10);
  v_seller_line numeric(18,4);
  v_order_line numeric(18,4);
  v_commission_seller numeric(18,4);
  v_seller_earning numeric(18,4);
  v_item_id uuid;
  v_seller_currency text;
  v_sku text;
  v_variant_name text;
  v_variant_attributes jsonb;
  v_unit_seller_price numeric(18,4);
  v_stock integer;
  v_reference text:=nullif(trim(p_checkout_reference),'');
  v_country text;
  v_shipping_quote jsonb;
  v_server_shipping numeric(18,4);
begin
  if v_customer is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'EMPTY_CART'; end if;
  if p_currency is null or not exists(
    select 1 from public.currencies c
    where c.code=upper(p_currency) and c.is_active=true and c.is_checkout_supported=true
  ) then raise exception 'INVALID_CHECKOUT_CURRENCY'; end if;
  p_currency:=upper(p_currency);
  if coalesce(p_shipping,0)<0 then raise exception 'INVALID_SHIPPING'; end if;
  if v_reference is not null and length(v_reference)>160 then raise exception 'INVALID_CHECKOUT_REFERENCE'; end if;
  select upper(coalesce(nullif(trim(country_code),''),'EG')) into v_country
  from public.profiles where id=v_customer;
  v_country:=coalesce(v_country,'EG');
  perform public.velora_assert_checkout_currency(v_country,p_currency);
  v_shipping_quote:=public.velora_quote_cart_shipping(p_items,v_country,p_currency);
  if coalesce((v_shipping_quote->>'requires_configuration')::boolean,false) then raise exception 'SHIPPING_CONFIGURATION_REQUIRED'; end if;
  v_server_shipping:=round(coalesce((v_shipping_quote->>'total_shipping')::numeric,0),4);
  if abs(v_server_shipping-round(coalesce(p_shipping,0),4))>0.01 then
    raise exception using message='SHIPPING_QUOTE_MISMATCH',
      detail=format('Server shipping %s %s does not match client quote %s %s',
        v_server_shipping,p_currency,round(coalesce(p_shipping,0),4),p_currency);
  end if;
  v_shipping:=v_server_shipping;
  if v_reference is not null then
    select o.id,o.order_number,o.total,o.currency into v_order_id,v_order_number,v_total,v_existing_currency
    from public.orders o where o.checkout_reference=v_reference and o.customer_id=v_customer limit 1;
    if v_order_id is not null then
      return jsonb_build_object('ok',true,'idempotent',true,'order_id',v_order_id,'order_number',v_order_number,
        'total',v_total,'currency',v_existing_currency);
    end if;
  end if;
  insert into public.orders(
    customer_id,status,subtotal,discount,shipping,total,currency,payment_status,
    customer_name,customer_phone,customer_email,customer_city,customer_address,
    customer_notes,checkout_reference
  ) values(
    v_customer,'pending',0,0,v_shipping,0,p_currency,'pending',
    p_customer_name,p_customer_phone,
    coalesce(p_customer_email,(select email from auth.users where id=v_customer)),
    p_customer_city,p_customer_address,p_customer_notes,v_reference
  )
  returning id,order_number into v_order_id,v_order_number;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_product_id:=(v_item->>'product_id')::uuid;
      v_quantity:=(v_item->>'quantity')::integer;
      v_variant_id:=case
        when nullif(trim(v_item->>'product_variant_id'),'') is null then null
        else (v_item->>'product_variant_id')::uuid
      end;
    exception when others then raise exception 'INVALID_ITEM_FORMAT'; end;

    if v_quantity is null or v_quantity<=0 then raise exception 'INVALID_QUANTITY'; end if;

    select p.*,s.store_name,s.status seller_status,s.id legacy_seller_id,s.plan,
           coalesce(p.currency_code,'USD') as seller_currency
      into v_product
    from public.products p
    join public.sellers s on s.id=p.seller_id
    where p.id=v_product_id
    for update;

    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if v_product.status::text<>'approved' then raise exception 'PRODUCT_NOT_AVAILABLE'; end if;
    if v_product.seller_status::text<>'approved' then raise exception 'SELLER_NOT_ACTIVE'; end if;

    v_unit_seller_price:=v_product.price;
    v_sku:=null;
    v_variant_name:=null;
    v_variant_attributes:='{}'::jsonb;
    v_stock:=v_product.stock;

    if v_variant_id is not null then
      select v.* into v_variant
      from public.product_variants v
      where v.id=v_variant_id and v.product_id=v_product_id and v.is_active=true
      for update;
      if not found then raise exception 'VARIANT_NOT_AVAILABLE'; end if;
      v_unit_seller_price:=coalesce(v_variant.price,v_product.price);
      v_sku:=v_variant.sku;
      v_variant_name:=v_variant.name;
      v_variant_attributes:=v_variant.attributes;
      v_stock:=v_variant.stock_quantity;
      if v_stock<v_quantity then raise exception 'INSUFFICIENT_VARIANT_STOCK'; end if;
    else
      if exists(select 1 from public.product_variants v where v.product_id=v_product_id and v.is_active=true) then
        raise exception 'VARIANT_SELECTION_REQUIRED';
      end if;
      if v_stock<v_quantity then raise exception 'INSUFFICIENT_STOCK'; end if;
    end if;

    v_seller_currency:=upper(v_product.seller_currency);
    if not exists(select 1 from public.currencies c where c.code=v_seller_currency and c.is_active=true) then
      raise exception 'INVALID_SELLER_CURRENCY';
    end if;
    v_fx:=public.velora_get_fx_rate(v_seller_currency,p_currency);
    if v_fx is null then raise exception 'FX_RATE_UNAVAILABLE'; end if;
    if v_fx<=0 then raise exception 'INVALID_FX_RATE'; end if;

    v_seller_line:=round(v_unit_seller_price::numeric*v_quantity,4);
    v_order_line:=round(v_seller_line*v_fx,4);
    v_commission_rate:=public.velora_get_commission_rate(v_product.legacy_seller_id);
    v_commission_seller:=round(v_seller_line*v_commission_rate/100,4);
    v_seller_earning:=round(v_seller_line-v_commission_seller,4);
    v_subtotal:=round(v_subtotal+v_order_line,4);

    if v_variant_id is not null then
      update public.product_variants
      set stock_quantity=stock_quantity-v_quantity,updated_at=now()
      where id=v_variant_id and stock_quantity>=v_quantity;
      if not found then raise exception 'INSUFFICIENT_VARIANT_STOCK'; end if;

      update public.products
      set stock=stock-v_quantity,updated_at=now()
      where id=v_product_id and stock>=v_quantity;
      if not found then raise exception 'INSUFFICIENT_STOCK'; end if;
    else
      update public.products
      set stock=stock-v_quantity,updated_at=now()
      where id=v_product_id and stock>=v_quantity;
      if not found then raise exception 'INSUFFICIENT_STOCK'; end if;
    end if;

    insert into public.order_items(
      order_id,seller_id,product_id,product_name,unit_price,quantity,subtotal,
      commission_rate,commission_amount,seller_earning,store_id,product_variant_id,
      product_variant_name,product_variant_attributes,store_name,sku,line_subtotal,
      seller_currency_code,seller_unit_price,seller_line_subtotal,fx_rate_to_order_currency
    ) values(
      v_order_id,v_product.legacy_seller_id,v_product.id,v_product.name,v_order_line/v_quantity,
      v_quantity,v_order_line,v_commission_rate,v_commission_seller*v_fx,v_seller_earning*v_fx,
      (select st.id from public.stores st
       where st.owner_id=(select s2.user_id from public.sellers s2 where s2.id=v_product.legacy_seller_id)
       order by st.created_at limit 1),
      v_variant_id,v_variant_name,v_variant_attributes,v_product.store_name,v_sku,v_order_line,
      v_seller_currency,v_unit_seller_price,v_seller_line,v_fx
    ) returning id into v_item_id;

    insert into public.commissions(
      order_id,order_item_id,seller_id,rate,gross_amount,commission_amount,seller_amount,
      order_currency_code,seller_currency_code,fx_rate_to_order_currency,status
    ) values(
      v_order_id,v_item_id,v_product.legacy_seller_id,v_commission_rate,v_seller_line,
      v_commission_seller,v_seller_earning,p_currency,v_seller_currency,v_fx,'pending'
    );
  end loop;

  if v_subtotal<=0 then raise exception 'INVALID_ORDER_TOTAL'; end if;
  v_total:=round(v_subtotal+v_shipping,4);

  update public.orders
  set subtotal=v_subtotal,total=v_total,shipping=v_shipping,updated_at=now()
  where id=v_order_id;

  insert into public.payments(order_id,provider,amount,currency,status,method)
  values(v_order_id,'velora_test_mode',v_total,p_currency,'pending','test');

  return jsonb_build_object('ok',true,'idempotent',false,'order_id',v_order_id,'order_number',v_order_number,
    'subtotal',v_subtotal,'shipping',v_shipping,'total',v_total,'currency',p_currency,'payment_status','pending');

exception
  when unique_violation then
    if v_reference is not null then
      select o.id,o.order_number,o.total,o.currency into v_order_id,v_order_number,v_total,v_existing_currency
      from public.orders o where o.checkout_reference=v_reference and o.customer_id=v_customer limit 1;
      if v_order_id is not null then
        return jsonb_build_object('ok',true,'idempotent',true,'order_id',v_order_id,'order_number',v_order_number,
          'total',v_total,'currency',v_existing_currency);
      end if;
    end if;
    raise;
end;
$function$;

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
begin
  if v_customer is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_order.customer_id <> v_customer then raise exception 'NOT_ORDER_OWNER'; end if;
  if v_order.payment_status::text <> 'pending' then raise exception 'ORDER_NOT_CANCELLABLE'; end if;
  if v_order.status::text not in ('pending','confirmed') then raise exception 'ORDER_NOT_CANCELLABLE'; end if;

  for v_item in select oi.* from public.order_items oi where oi.order_id=p_order_id for update loop
    if v_item.product_id is not null then
      if v_item.product_variant_id is not null then
        update public.product_variants
        set stock_quantity=stock_quantity+v_item.quantity,updated_at=now()
        where id=v_item.product_variant_id;
        if not found then raise exception 'VARIANT_NOT_FOUND'; end if;
      end if;

      update public.products
      set stock=stock+v_item.quantity,updated_at=now()
      where id=v_item.product_id;
      if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    end if;
    update public.commissions set status='reversed' where order_item_id=v_item.id and status='pending';
  end loop;

  update public.order_items set status='cancelled' where order_id=p_order_id and status <> 'cancelled';
  update public.orders set status='cancelled', payment_status='cancelled', updated_at=now() where id=p_order_id;
  update public.payments set status='cancelled', updated_at=now() where order_id=p_order_id and status='pending';
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_customer,'order_cancelled','order',p_order_id,jsonb_build_object('restocked',true));
  return jsonb_build_object('ok',true,'order_id',p_order_id,'status','cancelled');
end;
$function$;
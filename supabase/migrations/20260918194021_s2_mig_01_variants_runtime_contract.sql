-- S2-A core migration 20260918194021
-- Repository reconstruction from Restore-Test execution evidence and current effective definitions.
-- Supabase migration history retains version/name but not original SQL; byte identity is not claimed.
-- Production remains FROZEN.

alter table public.product_variants add column if not exists is_active boolean not null default true;
alter table public.order_items add column if not exists product_variant_name text;
alter table public.order_items add column if not exists product_variant_attributes jsonb not null default '{}'::jsonb;
create index if not exists idx_variants_active_product on public.product_variants(product_id,is_active);

drop policy if exists velora_product_variants_public_read on public.product_variants;
create policy velora_product_variants_public_read on public.product_variants
for select to anon,authenticated
using (is_active=true and exists(select 1 from public.products p where p.id=product_variants.product_id and p.status::text='approved'));

drop policy if exists velora_product_variants_owner on public.product_variants;
create policy velora_product_variants_owner on public.product_variants
for all to authenticated
using (exists(select 1 from public.products p join public.stores s on s.id=p.store_id where p.id=product_variants.product_id and (s.owner_id=(select auth.uid()) or public.velora_is_staff())))
with check (exists(select 1 from public.products p join public.stores s on s.id=p.store_id where p.id=product_variants.product_id and (s.owner_id=(select auth.uid()) or public.velora_is_staff())));

CREATE OR REPLACE FUNCTION public.velora_get_product_variants(p_product_id uuid)
 RETURNS TABLE(id uuid, product_id uuid, name text, sku text, price numeric, stock_quantity integer, attributes jsonb, is_active boolean)
 LANGUAGE sql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  select v.id,v.product_id,v.name,v.sku,v.price,v.stock_quantity,v.attributes,v.is_active
  from public.product_variants v
  join public.products p on p.id=v.product_id
  where v.product_id=p_product_id
    and v.is_active=true
    and p.status::text='approved'
  order by v.created_at asc,v.id asc;
$function$;

CREATE OR REPLACE FUNCTION public.velora_upsert_product_variant(p_product_id uuid, p_variant_id uuid, p_name text, p_sku text, p_price numeric, p_stock_quantity integer, p_attributes jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_seller uuid;
  v_store uuid;
  v_id uuid;
  v_name text:=nullif(trim(coalesce(p_name,'')),'');
  v_sku text:=nullif(trim(coalesce(p_sku,'')),'');
  v_attrs jsonb:=coalesce(p_attributes,'{}'::jsonb);
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.id,st.id into v_seller,v_store
  from public.sellers s
  left join public.stores st on st.owner_id=s.user_id and st.status='approved'
  where s.user_id=v_uid and s.status='approved'
  order by st.created_at desc nulls last limit 1;
  if v_seller is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;
  if v_store is null then raise exception 'APPROVED_STORE_REQUIRED'; end if;
  if not exists(select 1 from public.products p where p.id=p_product_id and p.seller_id=v_seller and p.store_id=v_store) then
    raise exception 'PRODUCT_NOT_OWNED';
  end if;
  if v_name is null or length(v_name)>300 then raise exception 'INVALID_VARIANT_NAME'; end if;
  if v_sku is null or length(v_sku)>120 then raise exception 'INVALID_VARIANT_SKU'; end if;
  if p_price is not null and (p_price<0 or p_price>999999999) then raise exception 'INVALID_VARIANT_PRICE'; end if;
  if p_stock_quantity is null or p_stock_quantity<0 or p_stock_quantity>2147483647 then raise exception 'INVALID_VARIANT_STOCK'; end if;
  if jsonb_typeof(v_attrs)<>'object' then raise exception 'INVALID_VARIANT_ATTRIBUTES'; end if;

  if p_variant_id is null then
    insert into public.product_variants(product_id,name,sku,price,stock_quantity,attributes,is_active,updated_at)
    values(p_product_id,v_name,v_sku,p_price,p_stock_quantity,v_attrs,true,now())
    returning id into v_id;
  else
    if not exists(select 1 from public.product_variants where id=p_variant_id and product_id=p_product_id) then
      raise exception 'VARIANT_NOT_FOUND_OR_NOT_OWNED';
    end if;
    update public.product_variants
      set name=v_name,sku=v_sku,price=p_price,stock_quantity=p_stock_quantity,
          attributes=v_attrs,is_active=true,updated_at=now()
    where id=p_variant_id
    returning id into v_id;
  end if;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,
         case when p_variant_id is null then 'seller_product_variant_created' else 'seller_product_variant_updated' end,
         'product_variant',v_id,
         jsonb_build_object('product_id',p_product_id,'seller_id',v_seller,'sku',v_sku));
  return v_id;
exception
  when unique_violation then raise exception 'VARIANT_SKU_ALREADY_EXISTS';
end;
$function$

CREATE OR REPLACE FUNCTION public.velora_retire_product_variant(p_variant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_product uuid;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select p.id into v_product
  from public.product_variants v
  join public.products p on p.id=v.product_id
  join public.sellers s on s.id=p.seller_id
  where v.id=p_variant_id and s.user_id=v_uid and s.status='approved';
  if v_product is null then raise exception 'VARIANT_NOT_FOUND_OR_NOT_OWNED'; end if;
  update public.product_variants set is_active=false,updated_at=now() where id=p_variant_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'seller_product_variant_retired','product_variant',p_variant_id,jsonb_build_object('product_id',v_product));
  return jsonb_build_object('ok',true,'variant_id',p_variant_id,'product_id',v_product,'is_active',false);
end;
$function$

CREATE OR REPLACE FUNCTION public.velora_upsert_cart_item_variant(p_product_id uuid, p_product_variant_id uuid, p_quantity integer, p_currency text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid:=auth.uid();
  v_cart uuid;
  v_existing integer:=0;
  v_stock integer;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_quantity is null or p_quantity<=0 then raise exception 'INVALID_QUANTITY'; end if;
  if p_product_variant_id is null then raise exception 'VARIANT_REQUIRED'; end if;
  if not exists(
    select 1 from public.products p
    join public.sellers s on s.id=p.seller_id
    join public.product_variants v on v.product_id=p.id
    where p.id=p_product_id and v.id=p_product_variant_id and v.is_active=true
      and p.status::text='approved' and s.status::text='approved'
  ) then raise exception 'VARIANT_NOT_AVAILABLE'; end if;

  select v.stock_quantity into v_stock
  from public.product_variants v
  where v.id=p_product_variant_id and v.product_id=p_product_id and v.is_active=true
  for update;

  select coalesce(ci.quantity,0) into v_existing
  from public.cart_items ci join public.carts c on c.id=ci.cart_id
  where c.customer_id=v_uid and ci.product_id=p_product_id and ci.product_variant_id=p_product_variant_id
  limit 1;

  if v_stock is not null and v_existing+p_quantity>v_stock then raise exception 'INSUFFICIENT_VARIANT_STOCK'; end if;

  insert into public.carts(customer_id,currency_code)
  values(v_uid,nullif(upper(trim(coalesce(p_currency,''))),''))
  on conflict(customer_id) do update set currency_code=coalesce(excluded.currency_code,public.carts.currency_code),updated_at=now()
  returning id into v_cart;

  insert into public.cart_items(cart_id,product_id,product_variant_id,quantity)
  values(v_cart,p_product_id,p_product_variant_id,p_quantity)
  on conflict(cart_id,product_id,product_variant_id)
  do update set quantity=public.cart_items.quantity+excluded.quantity,updated_at=now();

  update public.carts set updated_at=now() where id=v_cart;
  return jsonb_build_object('ok',true,'cart_id',v_cart,'product_id',p_product_id,'product_variant_id',p_product_variant_id,'quantity',p_quantity);
end;
$function$

CREATE OR REPLACE FUNCTION public.velora_set_cart_quantity_variant(p_product_id uuid, p_product_variant_id uuid, p_quantity integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_product_variant_id is null then raise exception 'VARIANT_REQUIRED'; end if;
  if p_quantity is null or p_quantity<0 then raise exception 'INVALID_QUANTITY'; end if;
  if p_quantity=0 then
    delete from public.cart_items ci using public.carts c
    where ci.cart_id=c.id and c.customer_id=v_uid
      and ci.product_id=p_product_id and ci.product_variant_id=p_product_variant_id;
  else
    update public.cart_items ci set quantity=p_quantity,updated_at=now()
    from public.carts c
    where ci.cart_id=c.id and c.customer_id=v_uid
      and ci.product_id=p_product_id and ci.product_variant_id=p_product_variant_id;
    if not found then raise exception 'CART_ITEM_NOT_FOUND'; end if;
  end if;
  update public.carts c set updated_at=now() where c.customer_id=v_uid;
  return jsonb_build_object('ok',true);
end;
$function$;
CREATE OR REPLACE FUNCTION public.velora_remove_cart_item_variant(p_product_id uuid, p_product_variant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_product_variant_id is null then raise exception 'VARIANT_REQUIRED'; end if;
  delete from public.cart_items ci using public.carts c
  where ci.cart_id=c.id and c.customer_id=v_uid
    and ci.product_id=p_product_id and ci.product_variant_id=p_product_variant_id;
  update public.carts c set updated_at=now() where c.customer_id=v_uid;
  return jsonb_build_object('ok',true);
end;
$function$

CREATE OR REPLACE FUNCTION public.velora_create_order(p_items jsonb, p_currency text DEFAULT NULL::text, p_shipping numeric DEFAULT 0, p_customer_name text DEFAULT NULL::text, p_customer_phone text DEFAULT NULL::text, p_customer_email text DEFAULT NULL::text, p_customer_city text DEFAULT NULL::text, p_customer_address text DEFAULT NULL::text, p_customer_notes text DEFAULT NULL::text, p_checkout_reference text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_customer uuid:=auth.uid();
  v_order_id uuid;
  v_order_number bigint;
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
begin
  v_order_number:=nextval('public.velora_order_number_seq');
  if v_customer is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'EMPTY_CART'; end if;
  if p_currency is null or not exists(
    select 1 from public.currencies c
    where c.code=upper(p_currency) and c.is_active=true and c.is_checkout_supported=true
  ) then raise exception 'INVALID_CHECKOUT_CURRENCY'; end if;
  p_currency:=upper(p_currency);
  if coalesce(p_shipping,0)<0 then raise exception 'INVALID_SHIPPING'; end if;
  if coalesce(p_shipping,0)<>0 then raise exception 'SHIPPING_QUOTE_REQUIRED'; end if;
  if v_reference is not null and length(v_reference)>160 then raise exception 'INVALID_CHECKOUT_REFERENCE'; end if;

  if v_reference is not null then
    select o.id,o.order_number,o.total,o.currency
      into v_order_id,v_order_number,v_total,p_currency
    from public.orders o
    where o.checkout_reference=v_reference and o.customer_id=v_customer
    limit 1;
    if v_order_id is not null then
      return jsonb_build_object(
        'ok',true,'idempotent',true,'order_id',v_order_id,'order_number',v_order_number,
        'total',v_total,'currency',p_currency
      );
    end if;
  end if;

  insert into public.orders(
    order_number,customer_id,status,subtotal,discount,shipping,total,currency,payment_status,
    customer_name,customer_phone,customer_email,customer_city,customer_address,
    customer_notes,checkout_reference
  ) values(
    v_order_number,v_customer,'pending',0,0,v_shipping,0,p_currency,'pending',
    p_customer_name,p_customer_phone,
    coalesce(p_customer_email,(select email from auth.users where id=v_customer)),
    p_customer_city,p_customer_address,p_customer_notes,v_reference
  )
  returning id into v_order_id;

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
    v_sku:=v_product.sku;
    v_variant_name:=null;
    v_variant_attributes:='{}'::jsonb;
    v_stock:=v_product.stock;

    if v_variant_id is not null then
      select v.* into v_variant
      from public.product_variants v
      where v.id=v_variant_id
        and v.product_id=v_product_id
        and v.is_active=true
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
  update public.orders set subtotal=v_subtotal,total=v_total,updated_at=now()
  where id=v_order_id;

  insert into public.payments(order_id,provider,amount,currency,status,method)
  values(v_order_id,'velora_test_mode',v_total,p_currency,'pending','test');

  return jsonb_build_object(
    'ok',true,'idempotent',false,'order_id',v_order_id,'order_number',v_order_number,
    'subtotal',v_subtotal,'shipping',v_shipping,'total',v_total,'currency',p_currency,
    'payment_status','pending'
  );
exception
  when unique_violation then
    if v_reference is not null then
      select o.id,o.order_number,o.total,o.currency
        into v_order_id,v_order_number,v_total,v_existing_currency
      from public.orders o
      where o.checkout_reference=v_reference and o.customer_id=v_customer
      limit 1;
      if v_order_id is not null then
        return jsonb_build_object(
          'ok',true,'idempotent',true,'order_id',v_order_id,'order_number',v_order_number,
          'total',v_total,'currency',v_existing_currency
        );
      end if;
    end if;
    raise;
end;
$function$


revoke all on function public.velora_get_product_variants(uuid) from public,anon,authenticated;
grant execute on function public.velora_get_product_variants(uuid) to anon,authenticated;
grant execute on function public.velora_upsert_product_variant(uuid,uuid,text,text,numeric,integer,jsonb) to authenticated;
grant execute on function public.velora_retire_product_variant(uuid) to authenticated;
grant execute on function public.velora_upsert_cart_item_variant(uuid,uuid,integer,text) to authenticated;
grant execute on function public.velora_set_cart_quantity_variant(uuid,uuid,integer) to authenticated;
grant execute on function public.velora_remove_cart_item_variant(uuid,uuid) to authenticated;
grant execute on function public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text) to authenticated;

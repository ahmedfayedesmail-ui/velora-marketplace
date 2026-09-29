-- VELORA — Seller Advertising Action Flow
-- Fixed-duration seller-paid ad add-ons. Restore-Test only until payment production gates are cleared.

create table if not exists public.seller_ad_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  placement text not null check (placement in ('shop_sponsored','home_spotlight')),
  duration_days integer not null check (duration_days > 0 and duration_days <= 365),
  price numeric(14,4) not null check (price > 0),
  currency_code text not null,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seller_ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.sellers(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  ad_package_id uuid not null references public.seller_ad_packages(id) on delete restrict,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','active','completed','payment_failed','cancelled','refunded')),
  price numeric(14,4) not null check (price > 0),
  currency_code text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  payment_attempt_id uuid,
  purchase_idempotency_key text unique,
  completed_at timestamptz,
  cancelled_at timestamptz,
  state_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_attempts add column if not exists seller_ad_campaign_id uuid;

do $$begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.payment_attempts'::regclass
      and conname='payment_attempts_seller_ad_campaign_id_fkey'
  ) then
    alter table public.payment_attempts
      add constraint payment_attempts_seller_ad_campaign_id_fkey
      foreign key (seller_ad_campaign_id)
      references public.seller_ad_campaigns(id)
      on delete restrict;
  end if;
end$$;

create unique index if not exists payment_attempts_seller_ad_campaign_uidx
  on public.payment_attempts(seller_ad_campaign_id)
  where seller_ad_campaign_id is not null;

create index if not exists seller_ad_campaigns_active_lookup_idx
  on public.seller_ad_campaigns(status, starts_at, ends_at, ad_package_id);
create index if not exists seller_ad_campaigns_seller_idx
  on public.seller_ad_campaigns(seller_id, created_at desc);
create index if not exists seller_ad_campaigns_product_idx
  on public.seller_ad_campaigns(product_id, status, starts_at, ends_at);

insert into public.seller_ad_packages
  (code,name,description,placement,duration_days,price,currency_code,sort_order,is_active)
values
  ('product_boost_3d','Product Boost — 3 Days','Sponsored placement in the marketplace shop for 3 days.','shop_sponsored',3,99,'EGP',10,true),
  ('featured_product_7d','Featured Product — 7 Days','Higher-priority sponsored placement in the marketplace shop and matching category for 7 days.','shop_sponsored',7,199,'EGP',20,true),
  ('home_spotlight_7d','Home Spotlight — 7 Days','Sponsored product spotlight on the Velora home experience for 7 days.','home_spotlight',7,499,'EGP',30,true)
on conflict (code) do nothing;

alter table public.seller_ad_packages enable row level security;
alter table public.seller_ad_campaigns enable row level security;
revoke all on table public.seller_ad_packages from anon,authenticated;
revoke all on table public.seller_ad_campaigns from anon,authenticated;

drop policy if exists seller_ad_packages_staff_read on public.seller_ad_packages;
create policy seller_ad_packages_staff_read on public.seller_ad_packages
for select to authenticated using (public.velora_is_staff());

drop policy if exists seller_ad_campaigns_staff_read on public.seller_ad_campaigns;
create policy seller_ad_campaigns_staff_read on public.seller_ad_campaigns
for select to authenticated using (public.velora_is_staff());

drop policy if exists seller_ad_campaigns_owner_read on public.seller_ad_campaigns;
create policy seller_ad_campaigns_owner_read on public.seller_ad_campaigns
for select to authenticated using (
  exists (select 1 from public.stores st where st.id=seller_ad_campaigns.store_id and st.owner_id=auth.uid())
);

create or replace function public.velora_get_seller_ad_checkout_context()
returns jsonb language plpgsql security definer set search_path to 'public','pg_catalog'
as $$
declare
  v_uid uuid:=auth.uid(); v_seller_id uuid; v_store_id uuid;
  v_country text; v_currency text; v_legal_docs jsonb; v_legal_ready boolean;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select s.id into v_seller_id from public.sellers s where s.user_id=v_uid and s.status='approved' limit 1;
  if v_seller_id is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;

  select st.id,upper(nullif(trim(st.country_code),'')),upper(nullif(trim(st.currency_code),''))
    into v_store_id,v_country,v_currency
  from public.stores st where st.owner_id=v_uid and st.status='approved'
  order by st.created_at desc limit 1;
  if v_store_id is null then raise exception 'APPROVED_STORE_REQUIRED'; end if;

  select coalesce(jsonb_agg(to_jsonb(d) order by d.document_type),'[]'::jsonb)
    into v_legal_docs
  from public.velora_get_required_legal_documents(
    coalesce((select lower(preferred_language) from public.profiles where id=v_uid),'en'),'seller'
  ) d where d.document_type in ('seller_agreement','acceptable_use');
  v_legal_ready := (select count(*)=2 from jsonb_array_elements(v_legal_docs));

  return jsonb_build_object(
    'ok',true,'seller_id',v_seller_id,'store_id',v_store_id,'country_code',v_country,
    'currency_code',coalesce(v_currency,case when v_country='EG' then 'EGP' else null end),
    'payment_country_supported',v_country='EG','legal_ready',v_legal_ready,'legal_documents',v_legal_docs,
    'packages',coalesce((
      select jsonb_agg(to_jsonb(p) order by p.sort_order,p.created_at,p.id)
      from public.seller_ad_packages p where p.is_active=true),'[]'::jsonb),
    'products',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',p.id,'name',p.name,'brand',p.brand,'category',p.category,'price',p.price,
        'currency_code',p.currency_code,'emoji',p.emoji,'images',p.images
      ) order by p.created_at desc,p.id desc)
      from public.products p
      where p.seller_id=v_seller_id and p.store_id=v_store_id and p.status='approved'),'[]'::jsonb),
    'campaigns',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',c.id,'product_id',c.product_id,'product_name',p.name,
        'package_id',c.ad_package_id,'package_code',ap.code,'package_name',ap.name,
        'placement',ap.placement,'status',c.status,'price',c.price,'currency_code',c.currency_code,
        'starts_at',c.starts_at,'ends_at',c.ends_at,'state_reason',c.state_reason,'created_at',c.created_at
      ) order by c.created_at desc,c.id desc)
      from public.seller_ad_campaigns c
      join public.products p on p.id=c.product_id
      join public.seller_ad_packages ap on ap.id=c.ad_package_id
      where c.seller_id=v_seller_id and c.store_id=v_store_id),'[]'::jsonb)
  );
end; $$;

create or replace function public.velora_create_seller_ad_payment_attempt(
  p_campaign_id uuid,p_method_id uuid,p_country_code text,p_idempotency_key text
) returns table(attempt_id uuid,provider_id uuid,provider_code text,provider_name text,environment text,amount numeric,currency_code text)
language plpgsql security definer set search_path to 'public'
as $$
declare
  v_uid uuid:=auth.uid(); v_campaign public.seller_ad_campaigns%rowtype; v_existing public.payment_attempts%rowtype;
  v_amount numeric; v_currency text; v_provider uuid; v_method uuid; v_attempt uuid;
begin
  if v_uid is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_campaign_id is null then raise exception 'AD_CAMPAIGN_REQUIRED'; end if;
  if length(trim(coalesce(p_idempotency_key,'')))<8 or length(trim(coalesce(p_idempotency_key,'')))>200 then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;
  if p_country_code is null or length(trim(p_country_code))<>2 then raise exception 'INVALID_COUNTRY_CODE';

  select c.* into v_campaign
  from public.seller_ad_campaigns c join public.stores st on st.id=c.store_id
  where c.id=p_campaign_id and st.owner_id=v_uid
    and c.seller_id=(select s.id from public.sellers s where s.user_id=v_uid and s.status='approved' limit 1)
  for update;
  if not found then raise exception 'AD_CAMPAIGN_NOT_FOUND'; end if;

  v_amount:=v_campaign.price; v_currency:=upper(v_campaign.currency_code);
  select * into v_existing from public.payment_attempts
  where idempotency_key=trim(p_idempotency_key) order by created_at desc limit 1;
  if found then
    if v_existing.purpose<>'seller_ad' or v_existing.seller_ad_campaign_id<>p_campaign_id
       or v_existing.amount is distinct from v_amount
       or upper(v_existing.currency_code)<>v_currency then raise exception 'IDEMPOTENCY_MISMATCH'; end if;
    return query select v_existing.id,pp.id,pp.code,pp.name,pp.environment,v_existing.amount,v_existing.currency_code
      from public.payment_providers pp where pp.id=v_existing.provider_id;
    return;
  end if;

  select r.provider_id,r.method_id into v_provider,v_method
  from public.velora_get_payment_route(upper(trim(p_country_code)),v_currency,p_method_id,v_amount) r limit 1;
  if v_provider is null then raise exception 'NO_PAYMENT_ROUTE'; end if;

  insert into public.payment_attempts(
    order_id,user_id,provider_id,method_id,amount,currency_code,purpose,seller_subscription_id,
    seller_ad_campaign_id,status,idempotency_key,payment_reference
  )
  values(null,v_uid,v_provider,coalesce(v_method,p_method_id),v_amount,v_currency,'seller_ad',null,
    p_campaign_id,'pending',trim(p_idempotency_key),gen_random_uuid()::text)
  on conflict (idempotency_key) where idempotency_key is not null do nothing
  returning id into v_attempt;

  if v_attempt is null then
    select * into v_existing from public.payment_attempts where idempotency_key=trim(p_idempotency_key)
    order by created_at desc limit 1;
    if v_existing.id is null then raise exception 'PAYMENT_ATTEMPT_CREATE_FAILED'; end if;
    if v_existing.purpose<>'seller_ad' or v_existing.seller_ad_campaign_id<>p_campaign_id
       or v_existing.amount is distinct from v_amount
       or upper(v_existing.currency_code)<>v_currency then raise exception 'IDEMPOTENCY_MISMATCH'; end if;
    v_attempt:=v_existing.id;
  end if;

  return query select v_attempt,pp.id,pp.code,pp.name,pp.environment,v_amount,v_currency
    from public.payment_providers pp where pp.id=v_provider;
end; $$;

create or replace function public.velora_attach_seller_ad_payment_provider_session(
  p_payment_attempt_id uuid,p_provider_code text,p_provider_session_id text,p_provider_order_id text
) returns jsonb language plpgsql security definer set search_path to 'public','pg_catalog'
as $$
declare v_uid uuid:=auth.uid(); v_attempt public.payment_attempts%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if nullif(trim(p_provider_code),'') is null or nullif(trim(p_provider_session_id),'') is null then raise exception 'INVALID_PROVIDER_SESSION'; end if;
  if lower(trim(p_provider_code))='paymob' and nullif(trim(p_provider_order_id),'') is null then raise exception 'PAYMOB_PROVIDER_ORDER_ID_REQUIRED'; end if;

  select pa.* into v_attempt
  from public.payment_attempts pa
  join public.seller_ad_campaigns c on c.id=pa.seller_ad_campaign_id
  join public.stores st on st.id=c.store_id
  where pa.id=p_payment_attempt_id and pa.user_id=v_uid and pa.purpose='seller_ad' and st.owner_id=v_uid
  for update;
  if not found then raise exception 'AD_PAYMENT_ATTEMPT_NOT_FOUND'; end if;

  update public.payment_attempts
  set provider_session_id=trim(p_provider_session_id),
      provider_payment_id=coalesce(provider_payment_id,trim(p_provider_session_id)),
      metadata=jsonb_set(coalesce(metadata,'{}'::jsonb),'{paymob_order_id}',to_jsonb(nullif(trim(p_provider_order_id),''))),
      updated_at=now()
  where id=p_payment_attempt_id;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'seller_ad_payment_provider_session_attached','payment_attempt',p_payment_attempt_id,
    jsonb_build_object('provider',lower(trim(p_provider_code)),'seller_ad_campaign_id',v_attempt.seller_ad_campaign_id,
      'provider_order_bound',nullif(trim(p_provider_order_id),'')));

  return jsonb_build_object('ok',true,'payment_attempt_id',p_payment_attempt_id,'provider',lower(trim(p_provider_code)),
    'seller_ad_campaign_id',v_attempt.seller_ad_campaign_id,'provider_order_bound',nullif(trim(p_provider_order_id),''));
end; $$;

create or replace function public.velora_sync_seller_ad_campaign(p_campaign_id uuid)
returns public.seller_ad_campaigns
language plpgsql security definer set search_path to 'public','pg_catalog'
as $$
declare
  v_campaign public.seller_ad_campaigns%rowtype; v_attempt public.payment_attempts%rowtype;
  v_pkg public.seller_ad_packages%rowtype; v_product_status text; v_old_status text; v_new_status text;
  v_owner uuid; v_reason text; v_now timestamptz:=now();
begin
  select c.* into v_campaign from public.seller_ad_campaigns c where c.id=p_campaign_id for update;
  if not found then raise exception 'AD_CAMPAIGN_NOT_FOUND'; end if;
  select * into v_pkg from public.seller_ad_packages where id=v_campaign.ad_package_id;
  if not found then raise exception 'AD_PACKAGE_NOT_FOUND'; end if;
  select p.status::text into v_product_status from public.products p where p.id=v_campaign.product_id;
  select st.owner_id into v_owner from public.stores st where st.id=v_campaign.store_id;
  select pa.* into v_attempt from public.payment_attempts pa
  where pa.seller_ad_campaign_id=v_campaign.id and pa.purpose='seller_ad'
  order by pa.created_at desc,pa.id desc limit 1;

  v_old_status:=v_campaign.status; v_new_status:=v_old_status;
  if v_campaign.status='active' and v_campaign.ends_at is not null and v_campaign.ends_at<=v_now then
    v_new_status:='completed'; v_reason:='DURATION_EXPIRED';
  elsif v_campaign.status='pending_payment' and coalesce(v_attempt.status,'')='captured' then
    if v_product_status='approved' then v_new_status:='active';
    else v_new_status:='cancelled'; v_reason:='PRODUCT_NOT_APPROVED_AT_PAYMENT_CAPTURE'; end if;
  elsif v_campaign.status='pending_payment' and coalesce(v_attempt.status,'')='failed' then
    v_new_status:='payment_failed'; v_reason:=coalesce(v_attempt.failure_code,v_attempt.error_code,'PAYMENT_FAILED');
  elsif v_campaign.status in ('pending_payment','active') and coalesce(v_attempt.status,'')='refunded' then
    v_new_status:='refunded'; v_reason:='PAYMENT_REFUNDED';
  end if;

  if v_new_status='active' and v_old_status<>'active' then
    v_campaign.starts_at:=coalesce(v_campaign.starts_at,v_now);
    v_campaign.ends_at:=coalesce(v_campaign.ends_at,v_campaign.starts_at+make_interval(days=>v_pkg.duration_days));
  end if;
  if v_new_status='completed' and v_old_status<>'completed' then v_campaign.completed_at:=v_now; end if;
  if v_new_status in ('cancelled','refunded') and v_old_status<>v_new_status then v_campaign.cancelled_at:=v_now; end if;

  if v_new_status<>v_old_status
     or v_campaign.starts_at is distinct from (select starts_at from public.seller_ad_campaigns where id=v_campaign.id)
     or v_campaign.ends_at is distinct from (select ends_at from public.seller_ad_campaigns where id=v_campaign.id)
  then
    update public.seller_ad_campaigns
    set status=v_new_status,starts_at=v_campaign.starts_at,ends_at=v_campaign.ends_at,
        completed_at=v_campaign.completed_at,cancelled_at=v_campaign.cancelled_at,
        state_reason=coalesce(v_reason,state_reason),updated_at=v_now
    where id=v_campaign.id returning * into v_campaign;

    insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
    values(v_owner,
      case v_campaign.status when 'active' then 'seller_ad_activated' when 'completed' then 'seller_ad_completed'
        when 'payment_failed' then 'seller_ad_payment_failed' when 'refunded' then 'seller_ad_refunded'
        when 'cancelled' then 'seller_ad_cancelled' else 'seller_ad_state_changed' end,
      'seller_ad_campaign',v_campaign.id,
      jsonb_build_object('previous_status',v_old_status,'new_status',v_campaign.status,'seller_id',v_campaign.seller_id,
        'store_id',v_campaign.store_id,'product_id',v_campaign.product_id,'package_id',v_campaign.ad_package_id,
        'payment_attempt_id',v_campaign.payment_attempt_id,'price',v_campaign.price,'currency_code',v_campaign.currency_code,
        'starts_at',v_campaign.starts_at,'ends_at',v_campaign.ends_at,'reason',v_campaign.state_reason));

    if v_campaign.status='active' then
      perform private.velora_create_notification(v_owner,'seller_ad_activated','Your sponsored product is live',
        'Your paid sponsored placement is now active until '||to_char(v_campaign.ends_at,'YYYY-MM-DD HH24:MI TZ')||'.',
        'seller_ad_campaign',v_campaign.id);
    elsif v_campaign.status='payment_failed' then
      perform private.velora_create_notification(v_owner,'seller_ad_payment_failed','Sponsored placement payment failed',
        'Your advertising purchase could not be completed. You can retry the purchase.','seller_ad_campaign',v_campaign.id);
    elsif v_campaign.status='completed' then
      perform private.velora_create_notification(v_owner,'seller_ad_completed','Sponsored placement ended',
        'Your sponsored placement has ended automatically.','seller_ad_campaign',v_campaign.id);
    elsif v_campaign.status='refunded' then
      perform private.velora_create_notification(v_owner,'seller_ad_refunded','Sponsored placement refunded',
        'The payment for your sponsored placement was refunded, so the placement is no longer active.',
        'seller_ad_campaign',v_campaign.id);
    end if;
  end if;
  return v_campaign;
end; $$;

create or replace function public.velora_start_seller_ad_purchase(
  p_ad_package_id uuid,p_product_id uuid,p_country_code text,p_idempotency_key text
) returns jsonb language plpgsql security definer set search_path to 'public','pg_catalog'
as $$
declare
  v_uid uuid:=auth.uid(); v_seller_id uuid; v_store public.stores%rowtype; v_pkg public.seller_ad_packages%rowtype;
  v_product public.products%rowtype; v_existing public.seller_ad_campaigns%rowtype; v_campaign public.seller_ad_campaigns%rowtype;
  v_attempt record; v_legal_locale text;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_ad_package_id is null then raise exception 'AD_PACKAGE_REQUIRED'; end if;
  if p_product_id is null then raise exception 'PRODUCT_REQUIRED'; end if;
  if length(trim(coalesce(p_idempotency_key,'')))<8 or length(trim(coalesce(p_idempotency_key,'')))>200 then raise exception 'INVALID_IDEMPOTENCY_KEY'; end if;
  if upper(trim(coalesce(p_country_code,'')))<>'EG' then raise exception 'AD_PAYMOB_EGYPT_ONLY'; end if;

  select s.id into v_seller_id from public.sellers s where s.user_id=v_uid and s.status='approved' limit 1;
  if v_seller_id is null then raise exception 'APPROVED_SELLER_REQUIRED'; end if;
  select st.* into v_store from public.stores st where st.owner_id=v_uid and st.status='approved' order by st.created_at desc limit 1;
  if not found then raise exception 'APPROVED_STORE_REQUIRED'; end if;
  if upper(nullif(trim(v_store.country_code),''))<>'EG' then raise exception 'STORE_COUNTRY_NOT_SUPPORTED_FOR_ADS'; end if;
  if upper(trim(p_country_code))<>upper(nullif(trim(v_store.country_code),'')) then raise exception 'AD_COUNTRY_MISMATCH'; end if;

  v_legal_locale:=coalesce((select lower(nullif(trim(preferred_language),'')) from public.profiles where id=v_uid),'en');
  perform public.velora_assert_legal_acceptance(array['seller_agreement','acceptable_use'],v_legal_locale);

  select * into v_pkg from public.seller_ad_packages p where p.id=p_ad_package_id and p.is_active=true;
  if not found then raise exception 'AD_PACKAGE_NOT_FOUND'; end if;
  if upper(v_pkg.currency_code)<>'EGP' then raise exception 'AD_PACKAGE_CURRENCY_UNSUPPORTED'; end if;

  select * into v_product from public.products p
  where p.id=p_product_id and p.seller_id=v_seller_id and p.store_id=v_store.id and p.status='approved';
  if not found then raise exception 'APPROVED_SELLER_PRODUCT_REQUIRED'; end if;

  select * into v_existing from public.seller_ad_campaigns c
  where c.purchase_idempotency_key=trim(p_idempotency_key) and c.seller_id=v_seller_id
  limit 1 for update;
  if found then
    perform public.velora_sync_seller_ad_campaign(v_existing.id);
    select * into v_existing from public.seller_ad_campaigns where id=v_existing.id;
    select pa.id as attempt_id,pa.provider_id,pa.amount,pa.currency_code,pa.status into v_attempt
    from public.payment_attempts pa where pa.seller_ad_campaign_id=v_existing.id and pa.purpose='seller_ad'
    order by pa.created_at desc,pa.id desc limit 1;
    return jsonb_build_object('ok',true,'reused',true,'campaign_id',v_existing.id,'campaign_status',v_existing.status,
      'package_id',v_existing.ad_package_id,'product_id',v_existing.product_id,'price',v_existing.price,
      'currency_code',v_existing.currency_code,'attempt_id',v_attempt.attempt_id,'payment_attempt_status',v_attempt.status);
  end if;

  if exists(select 1 from public.seller_ad_campaigns c
    where c.store_id=v_store.id and c.product_id=v_product.id and c.ad_package_id=v_pkg.id
      and c.status in ('pending_payment','active') and (c.ends_at is null or c.ends_at>now())
  ) then raise exception 'AD_PLACEMENT_ALREADY_ACTIVE_OR_PENDING'; end if;

  insert into public.seller_ad_campaigns(
    seller_id,store_id,product_id,ad_package_id,status,price,currency_code,purchase_idempotency_key,created_at,updated_at
  ) values(v_seller_id,v_store.id,v_product.id,v_pkg.id,'pending_payment',v_pkg.price,upper(v_pkg.currency_code),
    trim(p_idempotency_key),now(),now()) returning * into v_campaign;

  select * into v_attempt from public.velora_create_seller_ad_payment_attempt(
    v_campaign.id,(select id from public.payment_methods where code='card' and is_active=true limit 1),
    upper(v_store.country_code),trim(p_idempotency_key)) limit 1;
  if v_attempt.attempt_id is null then raise exception 'AD_PAYMENT_ATTEMPT_CREATE_FAILED'; end if;

  update public.seller_ad_campaigns set payment_attempt_id=v_attempt.attempt_id,updated_at=now()
  where id=v_campaign.id returning * into v_campaign;

  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(v_uid,'seller_ad_purchase_started','seller_ad_campaign',v_campaign.id,
    jsonb_build_object('seller_id',v_campaign.seller_id,'store_id',v_campaign.store_id,'product_id',v_campaign.product_id,
      'package_id',v_campaign.ad_package_id,'package_code',v_pkg.code,'placement',v_pkg.placement,
      'price',v_campaign.price,'currency_code',v_campaign.currency_code,'payment_attempt_id',v_attempt.attempt_id));

  return jsonb_build_object('ok',true,'reused',false,'campaign_id',v_campaign.id,'package_id',v_campaign.ad_package_id,
    'package_code',v_pkg.code,'product_id',v_campaign.product_id,'placement',v_pkg.placement,
    'campaign_status',v_campaign.status,'price',v_campaign.price,'currency_code',v_campaign.currency_code,
    'payment_attempt_id',v_attempt.attempt_id,'provider_id',v_attempt.provider_id,'provider_code',v_attempt.provider_code,
    'provider_name',v_attempt.provider_name,'environment',v_attempt.environment);
end; $$;

create or replace function public.velora_get_active_seller_ads(
  p_placement text default null,p_category text default null,p_limit integer default 8
) returns table(
  campaign_id uuid,product_id uuid,product_name text,brand text,category text,price numeric,currency_code text,emoji text,
  images jsonb,store_id uuid,store_name text,package_code text,package_name text,placement text,starts_at timestamptz,ends_at timestamptz
)
language sql stable security definer set search_path to 'public'
as $$
  select c.id,p.id,p.name,p.brand,p.category,p.price,coalesce(nullif(upper(p.currency_code),''),c.currency_code),p.emoji,p.images,
    st.id,st.name,ap.code,ap.name,ap.placement,c.starts_at,c.ends_at
  from public.seller_ad_campaigns c
  join public.products p on p.id=c.product_id
  join public.stores st on st.id=c.store_id
  join public.sellers s on s.id=c.seller_id
  join public.seller_ad_packages ap on ap.id=c.ad_package_id
  where c.status='active' and c.starts_at is not null and c.starts_at<=now() and c.ends_at is not null and c.ends_at>now()
    and p.status='approved' and st.status='approved' and s.status='approved' and ap.is_active=true
    and (p_placement is null or ap.placement=lower(trim(p_placement)))
    and (p_category is null or lower(coalesce(p.category,''))=lower(trim(p_category)) or lower(ap.placement)='home_spotlight')
  order by ap.sort_order asc,c.created_at asc,c.id asc
  limit greatest(least(coalesce(p_limit,8),24),1);
$$;

create or replace function public.velora_process_seller_ad_lifecycle(p_limit integer default 100)
returns integer language plpgsql security definer set search_path to 'public','pg_catalog'
as $$
declare r record; v_count integer:=0;
begin
  for r in select c.id from public.seller_ad_campaigns c
    where c.status='active' and c.ends_at is not null and c.ends_at<=now()
    order by c.ends_at asc,c.id asc
    limit greatest(least(coalesce(p_limit,100),500),1) for update skip locked
  loop perform public.velora_sync_seller_ad_campaign(r.id); v_count:=v_count+1; end loop;
  return v_count;
end; $$;

-- Existing notification cron remains the sole scheduler; it now also advances expired seller ads.
create or replace function public.velora_process_notification_lifecycle(p_limit integer default 100)
returns integer language plpgsql security definer set search_path to 'public','private','pg_catalog'
as $$
declare
 v_job record; v_count integer:=0; v_has_feedback boolean; v_newer_purchase boolean;
 v_subscription_current boolean; v_reminder_days integer; v_notification_type text;
begin
 perform public.velora_process_seller_ad_lifecycle(greatest(least(coalesce(p_limit,100),100),1));
 for v_job in
   select * from public.notification_lifecycle_jobs where status='pending' and due_at<=now()
   order by due_at,id limit greatest(least(coalesce(p_limit,100),500),1) for update skip locked
 loop
   if v_job.kind='experience_checkin' then
     select exists(select 1 from public.beauty_feedback bf
       where bf.order_item_id=(v_job.payload->>'order_item_id')::uuid and bf.user_id=v_job.user_id) into v_has_feedback;
     if v_has_feedback then
       update public.notification_lifecycle_jobs set status='cancelled',cancelled_at=now() where id=v_job.id;
     else
       perform private.velora_create_notification(v_job.user_id,'beauty_experience','How is your new product working for you?',
         'Tell Velora how '||coalesce(v_job.payload->>'product_name','your product')||' feels so we can improve your Beauty Journey.',
         v_job.entity_type,v_job.entity_id);
       update public.notification_lifecycle_jobs set status='sent',sent_at=now() where id=v_job.id; v_count:=v_count+1;
     end if;
   elsif v_job.kind='replenishment' then
     select exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id
       where o.customer_id=v_job.user_id and oi.product_id=(v_job.payload->>'product_id')::uuid
       and lower(coalesce(o.status::text,'')) in ('delivered','completed')
       and o.created_at>(select o2.created_at from public.order_items oi2 join public.orders o2 on o2.id=oi2.order_id
         where oi2.id=(v_job.payload->>'order_item_id')::uuid limit 1)) into v_newer_purchase;
     if v_newer_purchase then
       update public.notification_lifecycle_jobs set status='cancelled',cancelled_at=now() where id=v_job.id;
     else
       perform private.velora_create_notification(v_job.user_id,'replenishment','It may be time to replenish a beauty essential',
         coalesce(v_job.payload->>'product_name','A product')||' may be approaching its refill window.',
         v_job.entity_type,v_job.entity_id);
       update public.notification_lifecycle_jobs set status='sent',sent_at=now() where id=v_job.id; v_count:=v_count+1;
     end if;
   elsif v_job.kind in ('subscription_expiry_t5','subscription_expiry_t1') then
     select exists(select 1 from public.seller_subscriptions ss
       where ss.id=v_job.entity_id and ss.status='active' and ss.expires_at is not null and ss.expires_at>now()
       and ss.subscription_series_id::text=v_job.payload->>'subscription_series_id'
       and ss.expires_at=(v_job.payload->>'expires_at')::timestamptz) into v_subscription_current;
     if not v_subscription_current then
       update public.notification_lifecycle_jobs set status='cancelled',cancelled_at=now() where id=v_job.id;
     else
       v_reminder_days:=case when v_job.kind='subscription_expiry_t5' then 5 else 1 end;
       v_notification_type:=case when v_job.kind='subscription_expiry_t5' then 'seller_subscription_expiry_t5' else 'seller_subscription_expiry_t1' end;
       perform private.velora_create_notification(v_job.user_id,v_notification_type,'Seller subscription renewal reminder',
         case v_reminder_days when 5 then 'Your seller subscription expires in 5 days. Renew to keep paid seller benefits active.'
         else 'Your seller subscription expires tomorrow. Renew to keep paid seller benefits active.' end,
         v_job.entity_type,v_job.entity_id);
       update public.notification_lifecycle_jobs set status='sent',sent_at=now() where id=v_job.id; v_count:=v_count+1;
     end if;
   else
     update public.notification_lifecycle_jobs set status='cancelled',cancelled_at=now() where id=v_job.id;
   end if;
 end loop;
 return v_count;
end; $$;

revoke all on function public.velora_get_active_seller_ads(text,text,integer) from public;
grant execute on function public.velora_get_active_seller_ads(text,text,integer) to anon,authenticated;
revoke all on function public.velora_get_seller_ad_checkout_context() from public;
grant execute on function public.velora_get_seller_ad_checkout_context() to authenticated;
revoke all on function public.velora_create_seller_ad_payment_attempt(uuid,uuid,text,text) from public;
grant execute on function public.velora_create_seller_ad_payment_attempt(uuid,uuid,text,text) to authenticated;
revoke all on function public.velora_attach_seller_ad_payment_provider_session(uuid,text,text,text) from public;
grant execute on function public.velora_attach_seller_ad_payment_provider_session(uuid,text,text,text) to authenticated;
revoke all on function public.velora_sync_seller_ad_campaign(uuid) from public;
grant execute on function public.velora_sync_seller_ad_campaign(uuid) to authenticated;
revoke all on function public.velora_start_seller_ad_purchase(uuid,uuid,text,text) from public;
grant execute on function public.velora_start_seller_ad_purchase(uuid,uuid,text,text) to authenticated;
revoke all on function public.velora_process_seller_ad_lifecycle(integer) from public,anon,authenticated;

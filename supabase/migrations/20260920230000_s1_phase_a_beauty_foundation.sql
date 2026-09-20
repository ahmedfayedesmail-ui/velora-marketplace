-- Velora Sprint 1 Beauty MVP — Phase A
-- Restore-Test only. Production remains FROZEN.
-- Note: public.recommendation_runs already exists and is used by legacy recommendation intelligence.
-- Beauty recommendation history therefore uses dedicated beauty-prefixed tables.

begin;

create table if not exists public.beauty_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  quiz_version text not null,
  goal text not null,
  concern text not null,
  texture_preference text,
  effect_preference text,
  avoidance_preferences jsonb not null default '{}'::jsonb,
  shopping_priority text,
  updated_at timestamptz not null default now()
);

create table if not exists public.beauty_recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.beauty_profiles(user_id) on delete cascade,
  ruleset_version text not null,
  catalog_revision text not null,
  input_snapshot jsonb not null,
  input_fingerprint text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.beauty_recommendation_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.beauty_recommendation_runs(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  position smallint not null check (position between 1 and 5),
  score numeric(8,3) not null check (score >= 0 and score <= 100),
  reason_codes text[] not null,
  created_at timestamptz not null default now(),
  constraint beauty_recommendation_items_position_key unique (run_id, position),
  constraint beauty_recommendation_items_reason_codes_nonempty
    check (cardinality(reason_codes) >= 1)
);

create table if not exists public.beauty_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  texture text not null,
  effect text not null,
  source text not null check (source in ('purchase','product_interaction')),
  idempotency_key text not null,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending','approved','rejected')),
  moderation_note text,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  constraint beauty_feedback_user_id_idempotency_key_key
    unique (user_id, idempotency_key)
);

create unique index if not exists beauty_feedback_order_item_unique
  on public.beauty_feedback(order_item_id)
  where order_item_id is not null;

create index if not exists beauty_recommendation_runs_user_created_idx
  on public.beauty_recommendation_runs(user_id, created_at desc);

create index if not exists beauty_recommendation_runs_cache_idx
  on public.beauty_recommendation_runs(user_id, ruleset_version, catalog_revision, created_at desc);

create index if not exists beauty_recommendation_items_run_idx
  on public.beauty_recommendation_items(run_id);

create index if not exists beauty_recommendation_items_product_idx
  on public.beauty_recommendation_items(product_id);

create index if not exists beauty_feedback_user_created_idx
  on public.beauty_feedback(user_id, created_at desc);

create index if not exists beauty_feedback_order_item_idx
  on public.beauty_feedback(order_item_id);

create index if not exists beauty_feedback_product_idx
  on public.beauty_feedback(product_id);

alter table public.beauty_profiles enable row level security;
alter table public.beauty_recommendation_runs enable row level security;
alter table public.beauty_recommendation_items enable row level security;
alter table public.beauty_feedback enable row level security;

revoke all on public.beauty_profiles from public, anon;
revoke all on public.beauty_recommendation_runs from public, anon;
revoke all on public.beauty_recommendation_items from public, anon;
revoke all on public.beauty_feedback from public, anon;

grant select, insert, update on public.beauty_profiles to authenticated;
grant select on public.beauty_recommendation_runs to authenticated;
grant select on public.beauty_recommendation_items to authenticated;
grant select, insert on public.beauty_feedback to authenticated;

drop policy if exists beauty_profiles_self_select on public.beauty_profiles;
create policy beauty_profiles_self_select
on public.beauty_profiles
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists beauty_profiles_self_insert on public.beauty_profiles;
create policy beauty_profiles_self_insert
on public.beauty_profiles
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists beauty_profiles_self_update on public.beauty_profiles;
create policy beauty_profiles_self_update
on public.beauty_profiles
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists beauty_recommendation_runs_own_read on public.beauty_recommendation_runs;
create policy beauty_recommendation_runs_own_read
on public.beauty_recommendation_runs
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists beauty_recommendation_items_own_read on public.beauty_recommendation_items;
create policy beauty_recommendation_items_own_read
on public.beauty_recommendation_items
for select
to authenticated
using (
  exists (
    select 1
    from public.beauty_recommendation_runs r
    where r.id = beauty_recommendation_items.run_id
      and r.user_id = (select auth.uid())
  )
);

drop policy if exists beauty_feedback_self_read on public.beauty_feedback;
create policy beauty_feedback_self_read
on public.beauty_feedback
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists beauty_feedback_staff_read on public.beauty_feedback;
create policy beauty_feedback_staff_read
on public.beauty_feedback
for select
to authenticated
using (public.velora_is_staff());

drop policy if exists beauty_feedback_self_insert on public.beauty_feedback;
create policy beauty_feedback_self_insert
on public.beauty_feedback
for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
  and (
    source = 'product_interaction'
    or (
      source = 'purchase'
      and order_item_id is not null
      and exists (
        select 1
        from public.order_items oi
        join public.orders o on o.id = oi.order_id
        where oi.id = beauty_feedback.order_item_id
          and o.customer_id = (select auth.uid())
          and oi.product_id = beauty_feedback.product_id
          and (
            oi.product_variant_id = beauty_feedback.product_variant_id
            or (oi.product_variant_id is null and beauty_feedback.product_variant_id is null)
          )
      )
    )
  )
);

drop function if exists public.velora_moderate_beauty_feedback(uuid, text, text);
create function public.velora_moderate_beauty_feedback(
  p_feedback_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_row public.beauty_feedback%rowtype;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.velora_is_staff() then
    raise exception 'STAFF_REQUIRED';
  end if;

  if p_status not in ('pending','approved','rejected') then
    raise exception 'INVALID_MODERATION_STATUS';
  end if;

  update public.beauty_feedback
     set moderation_status = p_status,
         moderation_note = p_note,
         moderated_by = v_uid,
         moderated_at = now()
   where id = p_feedback_id
   returning * into v_row;

  if not found then
    raise exception 'FEEDBACK_NOT_FOUND';
  end if;

  return jsonb_build_object(
    'ok', true,
    'feedback_id', v_row.id,
    'moderation_status', v_row.moderation_status,
    'moderated_by', v_row.moderated_by
  );
end;
$function$;

revoke all on function public.velora_moderate_beauty_feedback(uuid, text, text) from public;
grant execute on function public.velora_moderate_beauty_feedback(uuid, text, text) to authenticated;

commit;
-- Velora Sprint 1 / Phase C
-- Data Contract v2 foundation.
-- Restore-Test only. Production remains FROZEN.
--
-- Owner Review Gate: APPROVED 2026-09-21.
-- This migration establishes the v2 Passport inputs and Routine domain.
-- Rules Engine RPC, Quiz v2 writer RPC, and UI are separate implementation steps.

begin;

alter table public.beauty_profiles
  add column if not exists skin_type text,
  add column if not exists routine_budget text;

alter table public.beauty_profiles
  drop constraint if exists beauty_profiles_skin_type_check;

alter table public.beauty_profiles
  add constraint beauty_profiles_skin_type_check
  check (
    skin_type is null
    or skin_type in ('oily','dry','combination','normal','unknown')
  );

alter table public.beauty_profiles
  drop constraint if exists beauty_profiles_routine_budget_check;

alter table public.beauty_profiles
  add constraint beauty_profiles_routine_budget_check
  check (
    routine_budget is null
    or routine_budget in ('under_500','500_1000','1000_2000','over_2000','unknown')
  );

comment on column public.beauty_profiles.skin_type
  is 'Phase C canonical Passport v2 input. Null until quiz.v2 is saved.';

comment on column public.beauty_profiles.routine_budget
  is 'Phase C canonical one-time routine budget band in EGP. Null until quiz.v2 is saved.';

create table if not exists public.beauty_routine_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.beauty_profiles(user_id) on delete cascade,
  contract_version text not null,
  ruleset_version text not null,
  catalog_revision text not null,
  input_fingerprint text not null,
  status text not null check (status in ('complete','partial','no_matches')),
  created_at timestamptz not null default now(),
  constraint beauty_routine_runs_contract_version_check
    check (contract_version = 'beauty-routine.v1'),
  constraint beauty_routine_runs_ruleset_version_check
    check (ruleset_version = 'beauty-rules.v2')
);

create table if not exists public.beauty_routine_steps (
  id uuid primary key default gen_random_uuid(),
  routine_run_id uuid not null references public.beauty_routine_runs(id) on delete cascade,
  step_order smallint not null check (step_order between 1 and 6),
  step_type text not null check (step_type in ('cleanse','treat','moisturize','protect')),
  is_optional boolean not null default false,
  selection_status text not null check (selection_status in ('selected','unavailable','not_needed')),
  product_id uuid references public.products(id) on delete restrict,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  reason_codes text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  constraint beauty_routine_steps_run_order_key
    unique (routine_run_id, step_order),
  constraint beauty_routine_steps_selection_consistency_check
    check (
      (selection_status = 'selected'
        and product_id is not null
        and cardinality(reason_codes) >= 1)
      or
      (selection_status in ('unavailable','not_needed')
        and product_id is null
        and product_variant_id is null)
    )
);

create index if not exists beauty_routine_runs_user_created_idx
  on public.beauty_routine_runs(user_id, created_at desc);

create index if not exists beauty_routine_steps_run_idx
  on public.beauty_routine_steps(routine_run_id);

create index if not exists beauty_routine_steps_product_idx
  on public.beauty_routine_steps(product_id);

create index if not exists beauty_routine_steps_variant_idx
  on public.beauty_routine_steps(product_variant_id);

alter table public.beauty_routine_runs enable row level security;
alter table public.beauty_routine_steps enable row level security;

revoke all on public.beauty_routine_runs from public, anon;
revoke all on public.beauty_routine_steps from public, anon;

grant select on public.beauty_routine_runs to authenticated;
grant select on public.beauty_routine_steps to authenticated;

drop policy if exists beauty_routine_runs_own_read on public.beauty_routine_runs;
create policy beauty_routine_runs_own_read
on public.beauty_routine_runs
for select
to authenticated
using (
  (select auth.uid()) is not null
  and (select auth.uid()) = user_id
);

drop policy if exists beauty_routine_steps_own_read on public.beauty_routine_steps;
create policy beauty_routine_steps_own_read
on public.beauty_routine_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.beauty_routine_runs r
    where r.id = beauty_routine_steps.routine_run_id
      and r.user_id = (select auth.uid())
  )
);

commit;

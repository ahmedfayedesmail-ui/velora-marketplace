-- Restore-Test / staging only. Production remains frozen.

create table if not exists public.seller_onboarding_cases (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique references public.sellers(id) on delete cascade,
  application_status text not null default 'draft' check (application_status in ('draft','submitted','in_review','approved','rejected')),
  identity_status text not null default 'pending' check (identity_status in ('pending','in_review','verified','rejected')),
  authenticity_status text not null default 'pending' check (authenticity_status in ('pending','in_review','verified','rejected','not_required')),
  catalog_status text not null default 'pending' check (catalog_status in ('pending','in_review','approved','rejected')),
  sla_status text not null default 'pending' check (sla_status in ('pending','accepted','rejected')),
  pilot_status text not null default 'not_started' check (pilot_status in ('not_started','active','passed','failed')),
  legal_name text, business_name text, contact_name text,
  contact_channel text check (contact_channel is null or contact_channel in ('email','phone','whatsapp','other')),
  evidence_refs jsonb not null default '{}'::jsonb,
  review_notes text, reviewer_user_id uuid references auth.users(id),
  submitted_at timestamptz, reviewed_at timestamptz, activated_at timestamptz, rejected_at timestamptz,
  rejection_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists idx_seller_onboarding_statuses on public.seller_onboarding_cases(application_status,identity_status,authenticity_status,catalog_status,sla_status,pilot_status);
alter table public.seller_onboarding_cases enable row level security;
drop policy if exists seller_onboarding_self_select on public.seller_onboarding_cases;
create policy seller_onboarding_self_select on public.seller_onboarding_cases for select to authenticated using (
  exists(select 1 from public.sellers s where s.id=seller_onboarding_cases.seller_id and s.user_id=auth.uid())
  or public.velora_is_staff()
);
-- No direct INSERT/UPDATE/DELETE client policy: use governed RPCs.

revoke all on function public.velora_get_own_seller_onboarding_case() from public;
grant execute on function public.velora_get_own_seller_onboarding_case() to authenticated;
revoke all on function public.velora_upsert_seller_onboarding_case(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text,text) from public;
grant execute on function public.velora_upsert_seller_onboarding_case(uuid,text,text,text,text,text,text,text,text,text,text,jsonb,text,text) to authenticated;

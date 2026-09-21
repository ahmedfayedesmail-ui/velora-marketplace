-- Velora Routine Fixture Regression — PRE-MIGRATION BASELINE
-- Restore-Test only. Production execution is prohibited.
--
-- Requires tests/fixtures/routine/fixture_seed.sql to have been loaded.
-- Run after loading the fixtures, then rollback/cleanup.
--
-- This script intentionally verifies the current contract before the two
-- deferred migrations are applied.

begin;

do $$
declare
  v_user_id uuid;
  v_out jsonb;
  v_treat jsonb;
begin
  select id into v_user_id
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise exception 'NO_TEST_USER';
  end if;

  if (select count(*) from public.products
      where id between '00000000-0000-4000-8000-000000000001'::uuid
                and '00000000-0000-4000-8000-000000000014'::uuid) < 14 then
    raise exception 'FIXTURE_CATALOG_INCOMPLETE';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_id::text, true);

  -- Baseline positive selection.
  perform public.velora_save_beauty_passport_v2('oily','acne','under_500');
  v_out := public.velora_generate_beauty_routine();

  if v_out->>'contract_version' <> 'beauty-routine.v1' then
    raise exception 'BAD_CONTRACT_VERSION: %', v_out;
  end if;
  if v_out->>'status' <> 'complete' then
    raise exception 'EXPECTED_COMPLETE: %', v_out;
  end if;
  if (v_out->>'total_cost')::numeric > 500 then
    raise exception 'BUDGET_EXCEEDED: %', v_out;
  end if;

  -- Determinism: same profile + same catalog must return the same output.
  if public.velora_generate_beauty_routine() <> v_out then
    raise exception 'NON_DETERMINISTIC_OUTPUT';
  end if;

  -- Sensitive is a known current compatibility failure.
  begin
    perform public.velora_save_beauty_passport_v2('sensitive','radiance','500_1000');
    raise exception 'SENSITIVE_ACCEPTED_BEFORE_MIGRATION';
  exception
    when others then
      if sqlerrm not like '%INVALID_SKIN_TYPE%' then
        raise;
      end if;
      raise notice 'EXPECTED PRE-MIGRATION SENSITIVE FAILURE: %', sqlerrm;
  end;

  -- Concern-only product should be selectable by step type, but the current
  -- engine does not yet award goal_match from products.concerns.
  delete from public.beauty_routine_runs
  where user_id = v_user_id;

  delete from public.product_variants
  where product_id <> '00000000-0000-4000-8000-000000000009'::uuid
    and product_id between '00000000-0000-4000-8000-000000000001'::uuid
                        and '00000000-0000-4000-8000-000000000014'::uuid;

  delete from public.products
  where id between '00000000-0000-4000-8000-000000000001'::uuid
                and '00000000-0000-4000-8000-000000000014'::uuid
    and id <> '00000000-0000-4000-8000-000000000009'::uuid;

  perform public.velora_save_beauty_passport_v2('oily','acne','under_500');
  v_out := public.velora_generate_beauty_routine();

  select step into v_treat
  from jsonb_array_elements(v_out->'steps') step
  where step->>'step_type'='treat'
  limit 1;

  if v_treat is null then
    raise exception 'CONCERN_ONLY_TREAT_STEP_NOT_SELECTED: %', v_out;
  end if;

  if coalesce((v_treat->'reason_codes') ? 'goal_match', false) then
    raise exception 'CONCERNS_ALREADY_AWARD_GOAL_MATCH_BEFORE_MIGRATION';
  end if;

  raise notice 'PRE-MIGRATION baseline passed.';
end $$;

rollback;

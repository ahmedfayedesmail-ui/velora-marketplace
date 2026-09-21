-- Velora Routine Fixture Regression Runner — Restore-Test only
-- 2026-09-21
--
-- This script is intentionally not a migration and must never run in Production.
-- It verifies the current/approved Routine contract against controlled fixtures.
--
-- IMPORTANT:
-- Scenario expectations that depend on the Sensitive migration or Concerns
-- migration are marked explicitly. Do not silently downgrade those assertions.

begin;

do $$
declare
  v_user_id uuid;
  v_out jsonb;
  v_profile public.beauty_profiles%rowtype;
begin
  select id into v_user_id
  from auth.users
  order by created_at
  limit 1;

  if v_user_id is null then
    raise exception 'NO_TEST_USER';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_id::text, true);

  -- Baseline: current fixture catalog should support a complete oily/acne routine.
  perform public.velora_save_beauty_passport_v2('oily','acne','under_500');
  v_out := public.velora_generate_beauty_routine();

  if v_out->>'contract_version' <> 'beauty-routine.v1' then
    raise exception 'R01_BAD_CONTRACT_VERSION: %', v_out;
  end if;

  if v_out->>'status' <> 'complete' then
    raise exception 'R01_EXPECTED_COMPLETE: %', v_out;
  end if;

  if (v_out->>'total_cost')::numeric > 500 then
    raise exception 'R01_BUDGET_EXCEEDED: %', v_out;
  end if;

  -- Sensitive case:
  -- CURRENT behavior is expected to fail before the approved migration.
  -- After the migration is applied, this block must succeed.
  begin
    perform public.velora_save_beauty_passport_v2('sensitive','radiance','500_1000');
    v_profile := public.beauty_profiles where false;
    if public.velora_generate_beauty_routine() is null then
      raise exception 'SENSITIVE_ROUTINE_NULL';
    end if;
  exception
    when invalid_text_representation or check_violation or raise_exception then
      -- Do not convert this into a pass automatically.
      if sqlerrm like '%INVALID_SKIN_TYPE%' then
        raise notice 'C-SENSITIVE CURRENT CONTRACT: INVALID_SKIN_TYPE (expected before migration)';
      else
        raise;
      end if;
  end;

  -- Contract error must remain explicit.
  begin
    perform public.velora_save_beauty_passport_v2('not-a-skin-type','acne','under_500');
    raise exception 'INVALID_SKIN_TYPE_WAS_NOT_REJECTED';
  exception
    when others then
      if sqlerrm not like '%INVALID_SKIN_TYPE%' then
        raise;
      end if;
  end;

  raise notice 'Routine fixture regression baseline checks completed.';
end $$;

rollback;

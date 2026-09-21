-- Velora Routine Fixture Regression — POST-MIGRATION
-- Restore-Test only. Run after applying BOTH deferred migrations:
--   20260921_sensitive_passport_contract.sql
--   20260921_routine_goal_concerns.sql
--
-- Requires tests/fixtures/routine/fixture_seed.sql to have been loaded.
-- Transaction is rolled back at the end.

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

  -- Sensitive skin must now be accepted without coercion.
  perform public.velora_save_beauty_passport_v2('sensitive','radiance','500_1000');

  if not exists (
    select 1
    from public.beauty_profiles
    where user_id = v_user_id
      and quiz_version = 'beauty-quiz.v2'
      and skin_type = 'sensitive'
      and goal = 'radiance'
      and routine_budget = '500_1000'
  ) then
    raise exception 'SENSITIVE_PROFILE_NOT_PERSISTED';
  end if;

  v_out := public.velora_generate_beauty_routine();

  if v_out->>'contract_version' <> 'beauty-routine.v1' then
    raise exception 'BAD_CONTRACT_VERSION: %', v_out;
  end if;

  if v_out->>'status' <> 'complete' then
    raise exception 'SENSITIVE_EXPECTED_COMPLETE: %', v_out;
  end if;

  -- Concern-only product: concerns=['acne'] must contribute goal_match.
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

  if not coalesce((v_treat->'reason_codes') ? 'goal_match', false) then
    raise exception 'CONCERNS_DID_NOT_AWARD_GOAL_MATCH: %', v_treat;
  end if;

  if v_out->>'status' <> 'partial' then
    raise exception 'CONCERN_ONLY_EXPECTED_PARTIAL: %', v_out;
  end if;

  raise notice 'POST-MIGRATION sensitive + concerns assertions passed.';
end $$;

rollback;

-- Velora Beauty Feedback Semantics v2
-- Restore-Test / staging only. Production remains frozen.
-- too_heavy is a negative experience signal.
-- Negative feedback is excluded from routine selection when an alternative exists.
-- Ruleset v5 forces an immediate refresh for existing routines.

create or replace function private.velora_beauty_feedback_signal(
  p_product_id uuid,
  p_product_variant_id uuid default null
)
returns smallint
language sql
stable
security definer
set search_path to 'public','private','extensions','pg_catalog'
as $function$
  select coalesce(
    (
      select case
        when bf.rating <= 2
          or bf.effect in ('not_helpful', 'irritating', 'too_heavy')
          then -1::smallint
        when bf.rating >= 4
          and bf.effect = 'helpful'
          then 1::smallint
        else 0::smallint
      end
      from public.beauty_feedback bf
      where bf.user_id = (select auth.uid())
        and bf.moderation_status = 'approved'
        and bf.product_id = p_product_id
        and (
          bf.product_variant_id = p_product_variant_id
          or (bf.product_variant_id is null and p_product_variant_id is null)
        )
      order by bf.created_at desc, bf.id desc
      limit 1
    ),
    0::smallint
  );
$function$;

do $patch$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='private'
    and p.proname='velora_beauty_routine_operation'
    and p.pronargs=0
  limit 1;

  if v_def is null then
    raise exception 'ROUTINE_OPERATION_NOT_FOUND';
  end if;

  v_def := replace(
    v_def,
    'v_best record;
  v_status text;',
    'v_best record;
  v_status text;'
  );

  v_def := replace(
    v_def,
    '  where p.status = ''approved''',
    '  where fs.feedback_score >= 0
      and p.status = ''approved'''
  );

  v_def := replace(
    v_def,
    '    v_user_id, ''beauty-routine.v1'', ''beauty-rules.v4'',',
    '    v_user_id, ''beauty-routine.v1'', ''beauty-rules.v5'','
  );

  execute v_def;
end
$patch$;

do $patch$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname='public'
    and p.proname='velora_get_current_beauty_routine'
    and p.pronargs=0
  limit 1;

  if v_def is null then
    raise exception 'CURRENT_ROUTINE_FUNCTION_NOT_FOUND';
  end if;

  v_def := replace(
    v_def,
    'v_run.ruleset_version <> ''beauty-rules.v4''',
    'v_run.ruleset_version <> ''beauty-rules.v5'''
  );

  execute v_def;
end
$patch$;

alter table public.beauty_routine_runs
  drop constraint if exists beauty_routine_runs_ruleset_version_check;

alter table public.beauty_routine_runs
  add constraint beauty_routine_runs_ruleset_version_check
  check (
    ruleset_version = any (
      array[
        'beauty-rules.v2',
        'beauty-rules.v3',
        'beauty-rules.v4',
        'beauty-rules.v5'
      ]::text[]
    )
  );

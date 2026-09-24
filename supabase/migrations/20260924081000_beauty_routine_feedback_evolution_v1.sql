-- Velora Beauty Routine Evolution v1
-- Restore-Test / staging only. Production remains FROZEN.
-- Extends the existing deterministic routine operation with approved,
-- product-specific experience signals. Pending/rejected feedback is ignored.

begin;

create or replace function private.velora_beauty_feedback_signal(
  p_product_id uuid,
  p_product_variant_id uuid default null
)
returns smallint
language sql
stable
security definer
set search_path = public, private, extensions, pg_catalog
as $function$
  select coalesce(
    (
      select case
        when bf.rating <= 2
          or bf.effect in ('not_helpful', 'irritating')
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

revoke all on function private.velora_beauty_feedback_signal(uuid, uuid) from public;

do $migration$
declare
  v_source text;
  v_new text;
begin
  select pg_get_functiondef(p.oid)
    into v_source
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'velora_beauty_routine_operation'
    and pg_get_function_identity_arguments(p.oid) = '';

  if v_source is null then
    raise exception 'ROUTINE_OPERATION_NOT_FOUND';
  end if;

  v_new := v_source;

  v_new := replace(
    v_new,
    '  v_catalog_revision text;\n  v_budget_limit numeric;',
    '  v_catalog_revision text;\n  v_feedback_revision text;\n  v_budget_limit numeric;'
  );

  v_new := replace(
    v_new,
    '  v_budget_limit := private.beauty_routine_budget_limit(v_profile.routine_budget);',
    '  v_budget_limit := private.beauty_routine_budget_limit(v_profile.routine_budget);\n\n  select coalesce(to_char(max(bf.created_at), ''YYYYMMDDHH24MISSMSOF''), ''none'')\n    into v_feedback_revision\n  from public.beauty_feedback bf\n  where bf.user_id = v_user_id\n    and bf.moderation_status = ''approved'';'
  );

  v_new := replace(
    v_new,
    '''shopping_priority'', nullif(private.beauty_routine_norm_token(v_profile.shopping_priority), '''')\n  );',
    '''shopping_priority'', nullif(private.beauty_routine_norm_token(v_profile.shopping_priority), ''''),\n    ''approved_feedback_revision'', v_feedback_revision\n  );'
  );

  v_new := replace(v_new, '''beauty-rules.v2''', '''beauty-rules.v3''');

  v_new := replace(
    v_new,
    '      coalesce(pv.price, p.price) as unit_price,\n      (',
    '      coalesce(pv.price, p.price) as unit_price,\n      fs.feedback_score,\n      ('
  );

  v_new := replace(
    v_new,
    '        case\n          when private.beauty_routine_norm_token(v_profile.skin_type) <> ''unknown''',
    '        case\n          when fs.feedback_score > 0 then ''feedback_positive''::text\n          when fs.feedback_score < 0 then ''feedback_avoid''::text\n        end,\n        case\n          when private.beauty_routine_norm_token(v_profile.skin_type) <> ''unknown'''
  );

  v_new := replace(
    v_new,
    '    ) pv on true\n    where p.status = ''approved''',
    '    ) pv on true\n    cross join lateral (\n      select private.velora_beauty_feedback_signal(p.id, pv.id) as feedback_score\n    ) fs\n    where p.status = ''approved'''
  );

  v_new := replace(
    v_new,
    '      skin_type_match desc,\n      unit_price asc,',
    '      skin_type_match desc,\n      fs.feedback_score desc,\n      unit_price asc,'
  );

  if v_new = v_source then
    raise exception 'ROUTINE_EVOLUTION_PATCH_NOT_APPLIED';
  end if;

  execute v_new;
end;
$migration$;

commit;

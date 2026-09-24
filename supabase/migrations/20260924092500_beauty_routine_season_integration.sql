-- Velora S1-D Layer 1B — connect Season Context to routine selection.
-- Restore-Test / staging only. Production remains frozen.

do $patch$
declare
  v_def text;
begin
  select pg_get_functiondef(p.oid)
    into v_def
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'velora_beauty_routine_operation'
    and p.pronargs = 0
  limit 1;

  if v_def is null then
    raise exception 'ROUTINE_OPERATION_NOT_FOUND';
  end if;

  if position('v_context jsonb;' in v_def) = 0 then
    v_def := replace(
      v_def,
      '  v_feedback_revision text;
  v_budget_limit numeric;',
      '  v_feedback_revision text;
  v_context jsonb;
  v_season text;
  v_budget_limit numeric;'
    );
  end if;

  if position('v_context := private.velora_beauty_context();' in v_def) = 0 then
    v_def := replace(
      v_def,
      '  select coalesce(to_char(max(bf.created_at), ''YYYYMMDDHH24MISSMSOF''), ''none'')
    into v_feedback_revision
  from public.beauty_feedback bf
  where bf.user_id = v_user_id
    and bf.moderation_status = ''approved'';

  v_input :=',
      '  select coalesce(to_char(max(bf.created_at), ''YYYYMMDDHH24MISSMSOF''), ''none'')
    into v_feedback_revision
  from public.beauty_feedback bf
  where bf.user_id = v_user_id
    and bf.moderation_status = ''approved'';

  v_context := private.velora_beauty_context();
  v_season := coalesce(v_context->>''season'', ''unknown'');

  v_input :='
    );
  end if;

  v_def := replace(
    v_def,
    '    ''approved_feedback_revision'', v_feedback_revision
  );',
    '    ''approved_feedback_revision'', v_feedback_revision,
    ''context'', v_context
  );'
  );

  v_def := replace(
    v_def,
    '      fs.feedback_score,
      (',
    '      fs.feedback_score,
      coalesce(
        case
          when jsonb_typeof(coalesce(p.seasonal_fit, ''{}''::jsonb)->v_season) = ''number''
            then ((coalesce(p.seasonal_fit, ''{}''::jsonb)->>v_season)::numeric)
          when jsonb_typeof(coalesce(p.seasonal_fit, ''{}''::jsonb)->v_season) = ''boolean''
            and ((coalesce(p.seasonal_fit, ''{}''::jsonb)->>v_season)::boolean) then 1
          else 0
        end, 0
      ) as seasonal_score,
      ('
  );

  v_def := replace(
    v_def,
    '        case
          when private.beauty_routine_norm_token(v_profile.skin_type) <> ''unknown''',
    '        case
          when coalesce(
            case
              when jsonb_typeof(coalesce(p.seasonal_fit, ''{}''::jsonb)->v_season) = ''number''
                then ((coalesce(p.seasonal_fit, ''{}''::jsonb)->>v_season)::numeric)
              when jsonb_typeof(coalesce(p.seasonal_fit, ''{}''::jsonb)->v_season) = ''boolean''
                and ((coalesce(p.seasonal_fit, ''{}''::jsonb)->>v_season)::boolean) then 1
              else 0
            end, 0
          ) > 0 then ''seasonal_fit''::text end,
        case
          when private.beauty_routine_norm_token(v_profile.skin_type) <> ''unknown'''
  );

  v_def := replace(
    v_def,
    '    ''schema_version'', ''beauty-passport.v2'',',
    '    ''schema_version'', ''beauty-passport.v2'',
    ''context_version'', ''beauty-context.v1'','
  );

  v_def := replace(
    v_def,
    '    v_user_id, ''beauty-routine.v1'', ''beauty-rules.v3'',',
    '    v_user_id, ''beauty-routine.v1'', ''beauty-rules.v4'','
  );

  v_def := replace(
    v_def,
    '      fs.feedback_score desc,
      unit_price asc,',
    '      fs.feedback_score desc,
      seasonal_score desc,
      unit_price asc,'
  );

  if position('v_context jsonb;' in v_def) = 0
     or position('v_season text;' in v_def) = 0
     or position('seasonal_score' in v_def) = 0
  then
    raise exception 'ROUTINE_SEASON_PATCH_FAILED';
  end if;

  execute v_def;
end
$patch$;


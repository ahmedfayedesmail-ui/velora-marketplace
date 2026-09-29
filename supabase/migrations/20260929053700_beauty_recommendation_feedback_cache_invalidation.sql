-- VELORA — Recommendation cache invalidation from approved Beauty Feedback
-- Restore-Test only; Production remains frozen.
--
-- Keep the public recommendation response contract unchanged.
-- Include a deterministic approved-feedback revision in the internal input
-- fingerprint so a new learning signal cannot be hidden behind the 24h cache.
-- Customer UI also refreshes on the existing velora:feedback-updated event.

CREATE OR REPLACE FUNCTION private.velora_beauty_recommendation_operation_v2()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private', 'extensions', 'pg_catalog'
AS $function$
declare
  v_user_id uuid:=(select auth.uid());
  v_profile public.beauty_profiles%rowtype;
  v_input jsonb;
  v_fingerprint text;
  v_catalog_revision text;
  v_ruleset_version text:='beauty-recommendation.v2';
  v_budget_limit numeric;
  v_feedback_revision text;
  v_cached_run_id uuid;
  v_rate_count integer;
  v_candidates jsonb;
  v_run_id uuid;
  v_item_count integer;
begin
  if v_user_id is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;

  select * into v_profile
  from public.beauty_profiles
  where user_id=v_user_id and quiz_version='beauty-quiz.v2';

  if not found or nullif(btrim(v_profile.skin_type),'') is null or nullif(btrim(v_profile.goal),'') is null or nullif(btrim(v_profile.routine_budget),'') is null then
    return jsonb_build_object('contract_version','beauty-recommendation.v2','status','incomplete','run',null,'recommendations','[]'::jsonb,'next_action','complete_passport');
  end if;

  v_budget_limit:=private.beauty_routine_budget_limit(v_profile.routine_budget);

  select coalesce(
    to_char(max(bf.created_at), 'YYYYMMDDHH24MISSMSOF'), 'none'
  ) || ':' || count(*)::text
    into v_feedback_revision
  from public.beauty_feedback bf
  where bf.user_id=v_user_id
    and bf.moderation_status='approved';

  v_input:=jsonb_build_object(
    'schema_version','beauty-passport.v2',
    'quiz_version',private.beauty_routine_norm_token(v_profile.quiz_version),
    'market_scope','EG',
    'currency_code','EGP',
    'skin_type',private.beauty_routine_norm_token(v_profile.skin_type),
    'goal',private.beauty_routine_norm_token(v_profile.goal),
    'routine_budget',private.beauty_routine_norm_token(v_profile.routine_budget),
    'approved_feedback_revision',v_feedback_revision
  );
  v_fingerprint:=encode(extensions.digest(v_input::text,'sha256'),'hex');
  v_catalog_revision:=private.beauty_catalog_revision_token();

  perform pg_advisory_xact_lock(hashtext(v_user_id::text)::bigint);

  select r.id into v_cached_run_id
  from public.beauty_recommendation_runs r
  where r.user_id=v_user_id and r.input_fingerprint=v_fingerprint and r.ruleset_version=v_ruleset_version
    and r.catalog_revision=v_catalog_revision and r.created_at>=now()-interval '24 hours'
  order by r.created_at desc limit 1;

  if v_cached_run_id is not null then
    return private.beauty_build_recommendation_response_v2(v_cached_run_id,true);
  end if;

  delete from private.beauty_recommendation_rate_events
  where user_id=v_user_id and created_at<now()-interval '10 minutes';

  select count(*) into v_rate_count
  from private.beauty_recommendation_rate_events
  where user_id=v_user_id and created_at>=now()-interval '10 minutes';

  if v_rate_count>=5 then
    return jsonb_build_object('contract_version','beauty-recommendation.v2','status','rate_limited','run',null,'recommendations','[]'::jsonb,'next_action','retry_later');
  end if;

  insert into private.beauty_recommendation_rate_events(user_id) values(v_user_id);

  with eligible as (
    select p.id,p.name,p.brand,p.price,p.currency_code,p.images,p.category,p.subcategory,p.stock,p.skin_types,p.concerns,p.tags,p.benefits,
           v.id as variant_id,coalesce(v.price,p.price) as unit_price,
           private.beauty_routine_norm_token(v_profile.skin_type) as profile_skin_type,
           private.beauty_routine_norm_token(v_profile.goal) as profile_goal,
           private.beauty_routine_norm_token(v_profile.routine_budget) as profile_budget,
           fs.feedback_score
    from public.products p
    left join lateral (
      select pv.id,pv.price
      from public.product_variants pv
      where pv.product_id=p.id and pv.is_active=true and pv.stock_quantity>0
      order by pv.price nulls last,pv.id limit 1
    ) v on true
    cross join lateral (select private.velora_beauty_feedback_signal(p.id,v.id) as feedback_score) fs
    where p.status='approved'
      and p.currency_code='EGP'
      and private.beauty_routine_norm_token(p.category)='beauty'
      and (coalesce(p.stock,0)>0 or v.id is not null)
      and coalesce(v.price,p.price)<=v_budget_limit
      and fs.feedback_score>=0
  ),
  scored as (
    select e.*,
      (
        case when e.profile_skin_type='unknown' then 0 when private.beauty_match_array(e.profile_skin_type,e.skin_types) then 30 else 0 end
        +case when private.beauty_match_array(e.profile_goal,e.tags) or private.beauty_match_array(e.profile_goal,e.benefits) or private.beauty_match_array(e.profile_goal,e.concerns) or private.beauty_match_scalar(e.profile_goal,e.subcategory) then 30 else 0 end
        +case when e.feedback_score>0 then 10 else 0 end
        +case when e.unit_price<=v_budget_limit then 5 else 0 end
        +5
      )::numeric(8,3) as score,
      array_remove(array[
        case when e.profile_skin_type<>'unknown' and private.beauty_match_array(e.profile_skin_type,e.skin_types) then 'skin_type_match'::text end,
        case when private.beauty_match_array(e.profile_goal,e.tags) or private.beauty_match_array(e.profile_goal,e.benefits) or private.beauty_match_array(e.profile_goal,e.concerns) or private.beauty_match_scalar(e.profile_goal,e.subcategory) then 'goal_match'::text end,
        case when e.feedback_score>0 then 'feedback_positive'::text end,
        case when e.unit_price<=v_budget_limit then 'budget_fit'::text end,
        'availability_match'::text
      ],null::text) as reason_codes
    from eligible e
  ),
  best_per_product as (
    select * from (
      select s.*,row_number() over(partition by s.id order by s.score desc,s.variant_id nulls last,s.variant_id) as product_rank
      from scored s
    ) x
    where x.product_rank=1
  ),
  numbered_results as (
    select b.*,row_number() over(order by b.score desc,b.id) as result_position
    from best_per_product b
    order by b.score desc,b.id
    limit 5
  )
  select coalesce(jsonb_agg(jsonb_build_object('product_id',id,'product_variant_id',variant_id,'position',result_position,'score',score,'reason_codes',reason_codes) order by result_position),'[]'::jsonb)
  into v_candidates
  from numbered_results;

  if jsonb_array_length(v_candidates)=0 then
    return jsonb_build_object('contract_version','beauty-recommendation.v2','status','no_matches','run',null,'recommendations','[]'::jsonb,'next_action','none');
  end if;

  insert into public.beauty_recommendation_runs(user_id,ruleset_version,catalog_revision,input_snapshot,input_fingerprint)
  values(v_user_id,v_ruleset_version,v_catalog_revision,v_input,v_fingerprint)
  returning id into v_run_id;

  insert into public.beauty_recommendation_items(run_id,product_id,product_variant_id,position,score,reason_codes)
  select v_run_id,x.product_id,x.product_variant_id,x.position::smallint,x.score::numeric(8,3),x.reason_codes
  from jsonb_to_recordset(v_candidates) as x(product_id uuid,product_variant_id uuid,position integer,score numeric,reason_codes text[]);

  get diagnostics v_item_count=row_count;

  if v_item_count=0 then
    delete from public.beauty_recommendation_runs where id=v_run_id;
    return jsonb_build_object('contract_version','beauty-recommendation.v2','status','no_matches','run',null,'recommendations','[]'::jsonb,'next_action','none');
  end if;

  return private.beauty_build_recommendation_response_v2(v_run_id,false);
end;
$function$


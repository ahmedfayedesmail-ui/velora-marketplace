create or replace function private.beauty_routine_step_match(
  p_step_type text,
  p_category text,
  p_subcategory text,
  p_tags jsonb,
  p_benefits jsonb
)
returns boolean
language sql
immutable
set search_path = private, pg_catalog
as $function$
  select case p_step_type
    when 'cleanse' then
      private.beauty_routine_norm_token(p_subcategory) in (
        'cleanse','cleanser','cleansing','face_wash','facial_wash','wash',
        'cleansing_gel','cleansing_foam'
      )
      or private.beauty_routine_array_has_token(p_tags, 'cleanse')
      or private.beauty_routine_array_has_token(p_tags, 'cleansing')
      or private.beauty_routine_array_has_token(p_benefits, 'cleanse')
      or private.beauty_routine_array_has_token(p_benefits, 'cleansing')
    when 'treat' then
      private.beauty_routine_norm_token(p_subcategory) in (
        'treat','treatment','serum','active','exfoliant','brightening',
        'acne_treatment','anti_aging','retinol','vitamin_c','dark_spots'
      )
      or private.beauty_routine_array_has_token(p_tags, 'treat')
      or private.beauty_routine_array_has_token(p_tags, 'treatment')
      or private.beauty_routine_array_has_token(p_tags, 'serum')
      or private.beauty_routine_array_has_token(p_tags, 'active')
      or private.beauty_routine_array_has_token(p_tags, 'exfoliant')
      or private.beauty_routine_array_has_token(p_tags, 'acne_treatment')
      or private.beauty_routine_array_has_token(p_tags, 'anti_aging')
      or private.beauty_routine_array_has_token(p_tags, 'retinol')
      or private.beauty_routine_array_has_token(p_tags, 'vitamin_c')
      or private.beauty_routine_array_has_token(p_benefits, 'treat')
      or private.beauty_routine_array_has_token(p_benefits, 'treatment')
      or private.beauty_routine_array_has_token(p_benefits, 'serum')
      or private.beauty_routine_array_has_token(p_benefits, 'active')
      or private.beauty_routine_array_has_token(p_benefits, 'exfoliant')
      or private.beauty_routine_array_has_token(p_benefits, 'acne_treatment')
      or private.beauty_routine_array_has_token(p_benefits, 'anti_aging')
      or private.beauty_routine_array_has_token(p_benefits, 'retinol')
      or private.beauty_routine_array_has_token(p_benefits, 'vitamin_c')
    when 'moisturize' then
      private.beauty_routine_norm_token(p_subcategory) in (
        'moisturize','moisturizer','moisturizing','cream',
        'face_cream','hydrating_cream','lotion'
      )
      or private.beauty_routine_array_has_token(p_tags, 'moisturize')
      or private.beauty_routine_array_has_token(p_tags, 'moisturizer')
      or private.beauty_routine_array_has_token(p_tags, 'cream')
      or private.beauty_routine_array_has_token(p_tags, 'face_cream')
      or private.beauty_routine_array_has_token(p_tags, 'hydrating_cream')
      or private.beauty_routine_array_has_token(p_tags, 'lotion')
      or private.beauty_routine_array_has_token(p_benefits, 'moisturize')
      or private.beauty_routine_array_has_token(p_benefits, 'moisturizer')
      or private.beauty_routine_array_has_token(p_benefits, 'cream')
      or private.beauty_routine_array_has_token(p_benefits, 'face_cream')
      or private.beauty_routine_array_has_token(p_benefits, 'hydrating_cream')
      or private.beauty_routine_array_has_token(p_benefits, 'lotion')
    when 'protect' then
      private.beauty_routine_norm_token(p_subcategory) in (
        'protect','sunscreen','spf','sun_protection','uv_protection','sunblock'
      )
      or private.beauty_routine_array_has_token(p_tags, 'protect')
      or private.beauty_routine_array_has_token(p_tags, 'sunscreen')
      or private.beauty_routine_array_has_token(p_tags, 'spf')
      or private.beauty_routine_array_has_token(p_tags, 'sun_protection')
      or private.beauty_routine_array_has_token(p_tags, 'uv_protection')
      or private.beauty_routine_array_has_token(p_tags, 'sunblock')
      or private.beauty_routine_array_has_token(p_benefits, 'protect')
      or private.beauty_routine_array_has_token(p_benefits, 'sunscreen')
      or private.beauty_routine_array_has_token(p_benefits, 'spf')
      or private.beauty_routine_array_has_token(p_benefits, 'sun_protection')
      or private.beauty_routine_array_has_token(p_benefits, 'uv_protection')
      or private.beauty_routine_array_has_token(p_benefits, 'sunblock')
    else
      false
  end;
$function$;

-- Velora Sprint 1 / B5
-- Recommendation Read Contract
-- Restore-Test/local implementation only.
-- Production remains FROZEN.

create or replace function public.velora_get_beauty_recommendation_history(p_limit integer default 10)
returns jsonb
language sql
security invoker
set search_path = public, pg_catalog
as $$
  with selected_runs as (
    select r.id, r.ruleset_version, r.catalog_revision, r.created_at
    from public.beauty_recommendation_runs r
    order by r.created_at desc, r.id desc
    limit least(greatest(coalesce(p_limit, 10), 1), 10)
  )
  select jsonb_build_object(
    'contract_version', 'beauty-recommendation-read.v1',
    'runs',
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'run', jsonb_build_object(
            'id', r.id,
            'ruleset_version', r.ruleset_version,
            'catalog_revision', r.catalog_revision,
            'created_at', r.created_at
          ),
          'recommendations',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'position', i.position,
                  'product_id', i.product_id,
                  'product_variant_id', i.product_variant_id,
                  'score', i.score,
                  'reason_codes', i.reason_codes,
                  'product',
                    case
                      when p.id is null then null
                      else jsonb_build_object(
                        'id', p.id,
                        'name', p.name,
                        'brand', p.brand,
                        'price', p.price,
                        'currency_code', p.currency_code,
                        'image_url',
                          case
                            when jsonb_typeof(p.images) = 'array'
                             and jsonb_array_length(p.images) > 0
                            then p.images ->> 0
                            else null
                          end
                      )
                    end,
                  'variant',
                    case
                      when v.id is null then null
                      else jsonb_build_object(
                        'id', v.id,
                        'name', v.name,
                        'price', v.price,
                        'attributes', v.attributes
                      )
                    end
                )
                order by i.position
              )
              from public.beauty_recommendation_items i
              left join public.products p on p.id = i.product_id
              left join public.product_variants v on v.id = i.product_variant_id
              where i.run_id = r.id
            ),
            '[]'::jsonb
          )
        )
        order by r.created_at desc, r.id desc
      ),
      '[]'::jsonb
    )
  )
  from selected_runs r;
$$;

revoke all on function public.velora_get_beauty_recommendation_history(integer) from public;
revoke execute on function public.velora_get_beauty_recommendation_history(integer) from anon;
grant execute on function public.velora_get_beauty_recommendation_history(integer) to authenticated;

revoke insert, update, delete on public.beauty_recommendation_runs from anon, authenticated;
revoke insert, update, delete on public.beauty_recommendation_items from anon, authenticated;

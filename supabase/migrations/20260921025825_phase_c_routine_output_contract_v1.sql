create or replace function private.beauty_build_routine_response(p_run_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, private, pg_catalog
as $function$
  select jsonb_build_object(
    'contract_version', 'beauty-routine.v1',
    'status', r.status,
    'steps',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'step_order', s.step_order,
            'step_type', s.step_type,
            'time_of_day', s.time_of_day,
            'selection_status', s.selection_status,
            'product',
              case
                when p.id is null then null
                else jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'brand', p.brand,
                  'price', p.price,
                  'currency', p.currency_code
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
              end,
            'reason_codes', coalesce(s.reason_codes, '{}'::text[])
          )
          order by s.step_order
        ) filter (where s.id is not null),
        '[]'::jsonb
      ),
    'total_cost',
      coalesce(
        sum(
          case
            when s.selection_status = 'selected'
              then coalesce(v.price, p.price)
            else 0
          end
        ),
        0
      ),
    'currency', 'EGP'
  )
  from public.beauty_routine_runs r
  left join public.beauty_routine_steps s
    on s.routine_run_id = r.id
  left join public.products p
    on p.id = s.product_id
  left join public.product_variants v
    on v.id = s.product_variant_id
  where r.id = p_run_id
  group by r.id, r.status;
$function$;

revoke execute on function private.beauty_build_routine_response(uuid) from public, anon, authenticated;

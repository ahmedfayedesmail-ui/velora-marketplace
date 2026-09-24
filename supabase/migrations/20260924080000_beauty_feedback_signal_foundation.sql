-- Velora Beauty Routine Evolution v1 foundation
-- Restore-Test / staging only. Production remains FROZEN.

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

commit;

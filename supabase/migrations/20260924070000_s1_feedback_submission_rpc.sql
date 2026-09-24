-- Velora Sprint 1 Beauty MVP — feedback submission foundation
-- Restore-Test only. Production remains FROZEN.
-- Customer submission is server-authoritative and idempotent.

begin;

create or replace function public.velora_submit_beauty_feedback(
  p_product_id uuid,
  p_product_variant_id uuid default null,
  p_order_item_id uuid default null,
  p_rating smallint default null,
  p_texture text default null,
  p_effect text default null,
  p_source text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_row public.beauty_feedback%rowtype;
  v_existing boolean := false;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_product_id is null then raise exception 'PRODUCT_REQUIRED'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'INVALID_RATING'; end if;
  if nullif(trim(coalesce(p_texture, '')), '') is null then raise exception 'TEXTURE_REQUIRED'; end if;
  if nullif(trim(coalesce(p_effect, '')), '') is null then raise exception 'EFFECT_REQUIRED'; end if;
  if p_source not in ('purchase', 'product_interaction') then raise exception 'INVALID_SOURCE'; end if;
  if nullif(trim(coalesce(p_idempotency_key, '')), '') is null then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;

  select exists(
    select 1 from public.beauty_feedback
    where user_id = v_uid and idempotency_key = trim(p_idempotency_key)
  ) into v_existing;

  if p_source = 'purchase' then
    if p_order_item_id is null then raise exception 'ORDER_ITEM_REQUIRED'; end if;
    if not exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = p_order_item_id
        and o.customer_id = v_uid
        and oi.product_id = p_product_id
        and (oi.product_variant_id = p_product_variant_id
          or (oi.product_variant_id is null and p_product_variant_id is null))
    ) then raise exception 'PURCHASE_NOT_ELIGIBLE'; end if;
  elsif p_order_item_id is not null then
    raise exception 'ORDER_ITEM_NOT_ALLOWED';
  end if;

  insert into public.beauty_feedback (
    user_id, product_id, product_variant_id, order_item_id,
    rating, texture, effect, source, idempotency_key, moderation_status
  )
  values (
    v_uid, p_product_id, p_product_variant_id, p_order_item_id,
    p_rating, trim(p_texture), trim(p_effect), p_source,
    trim(p_idempotency_key), 'pending'
  )
  on conflict (user_id, idempotency_key) do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row
    from public.beauty_feedback
    where user_id = v_uid and idempotency_key = trim(p_idempotency_key);
  end if;

  return jsonb_build_object(
    'ok', true,
    'feedback_id', v_row.id,
    'moderation_status', v_row.moderation_status,
    'idempotent', v_existing
  );
end;
$function$;

revoke all on function public.velora_submit_beauty_feedback(uuid, uuid, uuid, smallint, text, text, text, text) from public;
grant execute on function public.velora_submit_beauty_feedback(uuid, uuid, uuid, smallint, text, text, text, text) to authenticated;

commit;

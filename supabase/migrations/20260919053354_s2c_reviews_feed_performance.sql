-- S2-C published review feed performance
CREATE OR REPLACE FUNCTION public.velora_get_published_reviews_feed(
  p_limit integer default 50,
  p_offset integer default 0
)
RETURNS TABLE(
  id uuid,
  product_id uuid,
  product_name text,
  reviewer_name text,
  rating smallint,
  title text,
  content text,
  is_verified_purchase boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
SET search_path=''
AS $$
  select
    r.id,
    r.product_id,
    p.name,
    'Customer'::text,
    r.rating,
    r.title,
    r.content,
    r.is_verified_purchase,
    r.created_at
  from public.reviews r
  join public.products p on p.id=r.product_id
  where r.status='published'
  order by r.created_at desc,r.id desc
  limit greatest(1,least(coalesce(p_limit,50),200))
  offset greatest(coalesce(p_offset,0),0);
$$;

revoke all on function public.velora_get_published_reviews_feed(integer,integer) from public,anon,authenticated;
grant execute on function public.velora_get_published_reviews_feed(integer,integer) to anon,authenticated;

create index if not exists idx_reviews_published_created_at
  on public.reviews(created_at desc,id desc)
  where status='published';

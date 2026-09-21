-- Velora Routine Fixture Seed — Restore-Test only
-- 2026-09-21
--
-- This file is intentionally a test fixture, not a production migration.
-- Run inside an explicit transaction and ROLLBACK after the test suite.
-- It creates canonical public.products rows and one active variant.
--
-- Requirements:
-- * Restore-Test project
-- * at least one approved seller
-- * no Production execution
--
begin;

with seller_ctx as (
  select s.id as seller_id,
         st.id as store_id
  from public.sellers s
  left join lateral (
    select id
    from public.stores
    where owner_id = s.user_id
    order by created_at
    limit 1
  ) st on true
  where s.status = 'approved'
  order by s.created_at
  limit 1
)
insert into public.products (
  id, seller_id, store_id, name, brand, category, subcategory,
  description, price, stock, status, images,
  ingredients, benefits, how_to_use, warnings,
  skin_types, concerns, tags, currency_code
)
select
  v.id, s.seller_id, s.store_id, v.name, 'Velora Fixture',
  v.category, v.subcategory, 'TEST FIXTURE — DO NOT SHIP',
  v.price, 20, 'approved'::product_status, '[]'::jsonb,
  v.ingredients, v.benefits, null, null,
  v.skin_types, v.concerns, v.tags, 'EGP'
from seller_ctx s
cross join (values
  ('00000000-0000-4000-8000-000000000001'::uuid,'Fixture Cleanser Oily','beauty','cleanser',80::numeric,'["glycerin"]'::jsonb,'["cleansing"]'::jsonb,'["oily","combination"]'::jsonb,'["acne","daily_care"]'::jsonb,'["cleanse","cleansing"]'::jsonb),
  ('00000000-0000-4000-8000-000000000002'::uuid,'Fixture Cleanser Dry','beauty','cleanser',90::numeric,'["glycerin"]'::jsonb,'["cleansing"]'::jsonb,'["dry","normal"]'::jsonb,'["hydration","daily_care"]'::jsonb,'["cleanse","cleansing"]'::jsonb),
  ('00000000-0000-4000-8000-000000000003'::uuid,'Fixture Acne Serum','beauty','serum',120::numeric,'["niacinamide"]'::jsonb,'["acne"]'::jsonb,'["oily","combination","normal"]'::jsonb,'["acne"]'::jsonb,'["serum","treat"]'::jsonb),
  ('00000000-0000-4000-8000-000000000004'::uuid,'Fixture Hydration Serum','beauty','serum',130::numeric,'["hyaluronic_acid"]'::jsonb,'["hydration"]'::jsonb,'["dry","normal","combination"]'::jsonb,'["hydration"]'::jsonb,'["serum","treat"]'::jsonb),
  ('00000000-0000-4000-8000-000000000005'::uuid,'Fixture Brightening Serum','beauty','serum',180::numeric,'["vitamin_c"]'::jsonb,'["hyperpigmentation","radiance"]'::jsonb,'["dry","combination","normal","sensitive"]'::jsonb,'["hyperpigmentation","radiance"]'::jsonb,'["serum","treat","vitamin_c"]'::jsonb),
  ('00000000-0000-4000-8000-000000000006'::uuid,'Fixture Moisturizer Dry','beauty','moisturizer',110::numeric,'["ceramides"]'::jsonb,'["hydration"]'::jsonb,'["dry","normal","combination"]'::jsonb,'["hydration","daily_care"]'::jsonb,'["moisturize","moisturizer"]'::jsonb),
  ('00000000-0000-4000-8000-000000000007'::uuid,'Fixture Moisturizer Oily','beauty','moisturizer',100::numeric,'["niacinamide"]'::jsonb,'["hydration"]'::jsonb,'["oily","combination"]'::jsonb,'["daily_care","acne"]'::jsonb,'["moisturize","moisturizer"]'::jsonb),
  ('00000000-0000-4000-8000-000000000008'::uuid,'Fixture Sunscreen','beauty','sunscreen',100::numeric,'[]'::jsonb,'["sun_protection"]'::jsonb,'["oily","dry","combination","normal","sensitive"]'::jsonb,'["daily_care","hyperpigmentation"]'::jsonb,'["protect","sunscreen","spf"]'::jsonb),
  ('00000000-0000-4000-8000-000000000009'::uuid,'Fixture Concern-Only Acne Serum','beauty','serum',125::numeric,'["azelaic_acid"]'::jsonb,'[]'::jsonb,'["oily","combination"]'::jsonb,'["acne"]'::jsonb,'["serum","treat"]'::jsonb),
  ('00000000-0000-4000-8000-000000000010'::uuid,'Fixture Non-Match Body Lotion','beauty','body_lotion',75::numeric,'[]'::jsonb,'["hydration"]'::jsonb,'["oily"]'::jsonb,'["acne"]'::jsonb,'["body"]'::jsonb)
) as v(id,name,category,subcategory,price,ingredients,benefits,skin_types,concerns,tags) on true
where s.seller_id is not null;

insert into public.product_variants (
  id, product_id, name, sku, price, stock_quantity, attributes, is_active
)
values (
  '00000000-0000-4000-8000-000000000105',
  '00000000-0000-4000-8000-000000000005',
  'Fixture Brightening Serum 30ml',
  'VEL-FIX-BRIGHT-01',
  160,
  10,
  '{"size":"30ml"}'::jsonb,
  true
);

commit;

-- The fixture is deliberately left in place for the duration of the test run.
-- Cleanup MUST be explicit and MUST occur in Restore-Test only:
--
-- begin;
-- delete from public.product_variants
-- where id='00000000-0000-4000-8000-000000000105';
-- delete from public.products
-- where id in (
--   '00000000-0000-4000-8000-000000000001',
--   '00000000-0000-4000-8000-000000000002',
--   '00000000-0000-4000-8000-000000000003',
--   '00000000-0000-4000-8000-000000000004',
--   '00000000-0000-4000-8000-000000000005',
--   '00000000-0000-4000-8000-000000000006',
--   '00000000-0000-4000-8000-000000000007',
--   '00000000-0000-4000-8000-000000000008',
--   '00000000-0000-4000-8000-000000000009',
--   '00000000-0000-4000-8000-000000000010'
-- );
-- commit;

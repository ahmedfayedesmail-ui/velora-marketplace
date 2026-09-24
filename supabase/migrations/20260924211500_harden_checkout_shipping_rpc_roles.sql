revoke execute on function public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)
from anon;
grant execute on function public.velora_create_order(jsonb,text,numeric,text,text,text,text,text,text,text)
to authenticated;

revoke execute on function public.velora_create_shipment(uuid,uuid[],text,text,text,text,timestamptz)
from anon;
grant execute on function public.velora_create_shipment(uuid,uuid[],text,text,text,text,timestamptz)
to authenticated;

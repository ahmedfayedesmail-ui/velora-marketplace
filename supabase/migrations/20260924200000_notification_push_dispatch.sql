-- VELORA NOTIFICATION PUSH DISPATCH
-- Automatically fan out new in-app notifications to active
-- Web Push subscriptions through a private Edge Function.

do $$
begin
  if not exists (
    select 1
    from vault.secrets
    where name = 'velora_notification_dispatch_secret'
  ) then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'velora_notification_dispatch_secret',
      'Internal authentication secret for notification push dispatcher'
    );
  end if;
end
$$;

create or replace function public.velora_validate_notification_dispatch_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $function$
  select
    coalesce(auth.role(), '') = 'service_role'
    and p_secret is not null
    and exists (
      select 1
      from vault.decrypted_secrets
      where name = 'velora_notification_dispatch_secret'
        and decrypted_secret = p_secret
    );
$function$;

revoke all on function public.velora_validate_notification_dispatch_secret(text)
from public, anon, authenticated;
grant execute on function public.velora_validate_notification_dispatch_secret(text)
to service_role;

create or replace function private.velora_dispatch_notification_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_secret text;
begin
  if new.type = 'push_test' then
    return new;
  end if;

  select ds.decrypted_secret
    into v_secret
  from vault.decrypted_secrets ds
  where ds.name = 'velora_notification_dispatch_secret'
  limit 1;

  if nullif(v_secret, '') is null then
    raise warning 'VELORA_PUSH_DISPATCH_SECRET_MISSING';
    return new;
  end if;

  perform net.http_post(
    url := 'https://arlaxqmhtvjwjbjinjfw.supabase.co/functions/v1/velora-dispatch-notification',
    body := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-velora-internal-secret', v_secret
    )
  );

  return new;
end;
$function$;

drop trigger if exists trg_velora_notification_push_dispatch on public.notifications;

create trigger trg_velora_notification_push_dispatch
after insert on public.notifications
for each row
execute function private.velora_dispatch_notification_push();

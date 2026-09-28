-- Keep beauty-feedback moderation attribution server-controlled.
create or replace function private.velora_guard_beauty_feedback_moderation_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  if public.velora_is_staff() then
    return new;
  end if;

  -- Canonical customer submissions are auto-approved by the existing RPC.
  new.moderation_status := 'approved';
  new.moderation_note := null;
  new.moderated_by := null;
  new.moderated_at := null;

  return new;
end;
$function$;

drop trigger if exists trg_velora_guard_beauty_feedback_moderation_metadata on public.beauty_feedback;
create trigger trg_velora_guard_beauty_feedback_moderation_metadata
before insert on public.beauty_feedback
for each row
execute function private.velora_guard_beauty_feedback_moderation_metadata();

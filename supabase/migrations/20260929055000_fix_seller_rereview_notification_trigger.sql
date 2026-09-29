-- Velora Restore-Test only.
-- The seller profile RPC can change NEW.status in a BEFORE UPDATE trigger.
-- PostgreSQL UPDATE OF status triggers are based on the original SET list,
-- so use a plain AFTER UPDATE trigger and let the notification function
-- decide whether status actually changed.

drop trigger if exists trg_velora_seller_status_notification on public.sellers;

create trigger trg_velora_seller_status_notification
after update on public.sellers
for each row
execute function private.velora_notify_seller_status();

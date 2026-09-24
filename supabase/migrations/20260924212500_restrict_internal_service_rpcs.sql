revoke execute on function public.velora_create_subscription_payment_attempt_internal(uuid,text)
from public, anon, authenticated;
grant execute on function public.velora_create_subscription_payment_attempt_internal(uuid,text)
to service_role;

revoke execute on function public.velora_create_subscription_renewal_payment_attempt_internal(uuid)
from public, anon, authenticated;
grant execute on function public.velora_create_subscription_renewal_payment_attempt_internal(uuid)
to service_role;

revoke execute on function public.velora_get_mock_paymob_hmac_internal()
from public, anon, authenticated;
grant execute on function public.velora_get_mock_paymob_hmac_internal()
to service_role;

revoke execute on function public.velora_process_paymob_transaction_internal(jsonb)
from public, anon, authenticated;
grant execute on function public.velora_process_paymob_transaction_internal(jsonb)
to service_role;

revoke execute on function public.velora_test_create_fixture()
from public, anon, authenticated;
grant execute on function public.velora_test_create_fixture()
to service_role;

revoke execute on function public.velora_test_delete_fixture(uuid)
from public, anon, authenticated;
grant execute on function public.velora_test_delete_fixture(uuid)
to service_role;

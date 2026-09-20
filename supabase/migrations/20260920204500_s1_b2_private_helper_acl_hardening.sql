-- B2 security hardening: keep internal helpers non-callable by application roles.
revoke all on function private.beauty_norm_text(text) from public, anon, authenticated;
revoke all on function private.beauty_match_array(text, jsonb) from public, anon, authenticated;
revoke all on function private.beauty_match_scalar(text, text) from public, anon, authenticated;
revoke all on function private.beauty_match_object(text, jsonb) from public, anon, authenticated;
revoke all on function private.beauty_catalog_revision_bump() from public, anon, authenticated;
revoke all on function private.beauty_products_catalog_revision_trigger() from public, anon, authenticated;
revoke all on function private.beauty_variants_catalog_revision_trigger() from public, anon, authenticated;
revoke all on function private.beauty_catalog_revision_token() from public, anon, authenticated;
revoke all on function private.beauty_build_run_response(uuid, boolean) from public, anon, authenticated;
revoke all on function private.velora_beauty_recommendation_operation() from public, anon, authenticated;

grant execute on function private.velora_beauty_recommendation_operation() to authenticated;
grant usage on schema private to authenticated;
-- Rollback for S2-B privilege hardening.
revoke select,insert,update,delete on public.wishlists, public.wishlist_items from anon, authenticated;
grant select on public.wishlists, public.wishlist_items to anon, authenticated;

revoke all on function public.velora_get_wishlist() from anon, authenticated;
revoke all on function public.velora_toggle_wishlist(uuid) from anon, authenticated;
revoke all on function public.velora_merge_wishlist(uuid[]) from anon, authenticated;
grant execute on function public.velora_get_wishlist() to anon, authenticated;
grant execute on function public.velora_toggle_wishlist(uuid) to anon, authenticated;
grant execute on function public.velora_merge_wishlist(uuid[]) to anon, authenticated;

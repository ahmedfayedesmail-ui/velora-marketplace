-- S2-B privilege hardening applied on Restore-Test.
revoke all on public.wishlists, public.wishlist_items from anon;
revoke all on public.wishlists, public.wishlist_items from authenticated;
grant select on public.wishlists, public.wishlist_items to authenticated;

revoke all on function public.velora_get_wishlist() from public;
revoke all on function public.velora_get_wishlist() from anon;
revoke all on function public.velora_get_wishlist() from authenticated;
grant execute on function public.velora_get_wishlist() to authenticated;

revoke all on function public.velora_toggle_wishlist(uuid) from public;
revoke all on function public.velora_toggle_wishlist(uuid) from anon;
revoke all on function public.velora_toggle_wishlist(uuid) from authenticated;
grant execute on function public.velora_toggle_wishlist(uuid) to authenticated;

revoke all on function public.velora_merge_wishlist(uuid[]) from public;
revoke all on function public.velora_merge_wishlist(uuid[]) from anon;
revoke all on function public.velora_merge_wishlist(uuid[]) from authenticated;
grant execute on function public.velora_merge_wishlist(uuid[]) to authenticated;

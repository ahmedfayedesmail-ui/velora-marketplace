-- VELORA — Retire legacy V1 Beauty Passport runtime contract.
-- Restore-Test only; Production remains frozen.
-- Current loaded-runtime dependency sweep found no callers outside
-- src/scripts/58-s1-b1-beauty-passport.js, which is no longer loaded.
revoke execute on function public.velora_save_beauty_profile(text,text,text,text,text,jsonb,text) from authenticated;

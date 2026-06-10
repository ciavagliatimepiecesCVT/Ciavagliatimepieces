-- Lock down SECURITY DEFINER functions flagged by the Supabase security advisor.

-- _maybe_create_policy runs arbitrary SQL via EXECUTE and is a migration-time helper
-- only; it must not be reachable from the public REST API (anon/authenticated).
revoke execute on function public._maybe_create_policy(text, text, text, text) from anon, authenticated, public;
alter function public._maybe_create_policy(text, text, text, text) set search_path = '';

-- get_order_tracking and get_site_settings are intentionally public reads, but pin
-- their search_path so a malicious schema on the path can't hijack them.
alter function public.get_order_tracking(text) set search_path = '';
alter function public.get_site_settings() set search_path = pg_catalog, public;
alter function public.update_updated_at_column() set search_path = '';

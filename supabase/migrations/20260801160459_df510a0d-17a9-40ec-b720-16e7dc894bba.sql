REVOKE EXECUTE ON FUNCTION public.is_superadmin(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_school_access(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_school_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.list_all_schools() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_superadmin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_school_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_school_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_all_schools() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_school_access(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_school_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_school_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_school_ids() TO authenticated;

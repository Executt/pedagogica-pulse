
CREATE OR REPLACE FUNCTION public.list_all_schools()
RETURNS TABLE(id UUID, name TEXT, city TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.id, s.name, s.city FROM public.schools s ORDER BY s.name;
$$;
REVOKE EXECUTE ON FUNCTION public.list_all_schools() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_all_schools() TO authenticated;

-- Escopo do usuário: unidades organizacionais (própria + descendentes)
CREATE OR REPLACE FUNCTION public.user_org_unit_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH RECURSIVE roots AS (
    SELECT org_unit_id AS id FROM public.user_roles
    WHERE user_id = auth.uid() AND org_unit_id IS NOT NULL
  ), tree AS (
    SELECT id FROM roots
    UNION
    SELECT o.id FROM public.org_units o JOIN tree t ON o.parent_id = t.id
  )
  SELECT id FROM tree;
$$;

-- Escopo do usuário: escolas (diretas + herdadas da hierarquia)
CREATE OR REPLACE FUNCTION public.user_scope_school_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id FROM public.schools s
  WHERE s.id IN (SELECT school_id FROM public.user_roles WHERE user_id = auth.uid() AND school_id IS NOT NULL)
     OR s.org_unit_id IN (SELECT public.user_org_unit_ids());
$$;

-- Acesso a escola: superadmin, vínculo direto ou herança hierárquica
CREATE OR REPLACE FUNCTION public.has_school_access(_school_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_superadmin(auth.uid())
      OR EXISTS (SELECT 1 FROM public.user_roles
                 WHERE user_id = auth.uid() AND school_id = _school_id)
      OR EXISTS (SELECT 1 FROM public.schools s
                 WHERE s.id = _school_id
                   AND s.org_unit_id IN (SELECT public.user_org_unit_ids()));
$$;

-- Acesso a unidade organizacional (própria, descendente ou ancestral da minha)
CREATE OR REPLACE FUNCTION public.has_org_unit_access(_org_unit_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_superadmin(auth.uid())
      OR _org_unit_id IN (SELECT public.user_org_unit_ids());
$$;

-- Políticas de org_units
DROP POLICY IF EXISTS "org units select scoped" ON public.org_units;
CREATE POLICY "org units select scoped" ON public.org_units
  FOR SELECT TO authenticated USING (public.has_org_unit_access(id));

DROP POLICY IF EXISTS "org units insert superadmin" ON public.org_units;
CREATE POLICY "org units insert superadmin" ON public.org_units
  FOR INSERT TO authenticated WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "org units update superadmin" ON public.org_units;
CREATE POLICY "org units update superadmin" ON public.org_units
  FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));

-- Escolas: superadmin pode manter o cadastro (importador oficial)
DROP POLICY IF EXISTS "schools insert superadmin" ON public.schools;
CREATE POLICY "schools insert superadmin" ON public.schools
  FOR INSERT TO authenticated WITH CHECK (public.is_superadmin(auth.uid()));

DROP POLICY IF EXISTS "schools update superadmin" ON public.schools;
CREATE POLICY "schools update superadmin" ON public.schools
  FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));

-- Superfície mínima das funções internas
REVOKE ALL ON FUNCTION public.user_org_unit_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.user_scope_school_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_org_unit_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_org_unit_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_scope_school_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_org_unit_access(uuid) TO authenticated, service_role;

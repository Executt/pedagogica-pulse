CREATE TABLE public.import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL DEFAULT '',
  total_detected integer NOT NULL DEFAULT 0,
  inserted_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  units_count integer NOT NULL DEFAULT 0,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.import_runs TO authenticated;
GRANT ALL ON public.import_runs TO service_role;
ALTER TABLE public.import_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import runs insert own" ON public.import_runs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "import runs select scoped" ON public.import_runs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin(auth.uid()));

CREATE INDEX idx_import_runs_created ON public.import_runs (created_at DESC);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  field text,
  old_value text,
  new_value text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit select superadmin" ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));

CREATE INDEX idx_audit_log_created ON public.audit_log (created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity, entity_id);

CREATE OR REPLACE FUNCTION public.audit_school_org_unit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.org_unit_id IS DISTINCT FROM OLD.org_unit_id THEN
    INSERT INTO public.audit_log (actor_id, entity, entity_id, action, field, old_value, new_value, metadata)
    VALUES (auth.uid(), 'schools', NEW.id, 'update', 'org_unit_id',
            OLD.org_unit_id::text, NEW.org_unit_id::text,
            jsonb_build_object('school_name', NEW.name));
  ELSIF TG_OP = 'INSERT' AND NEW.org_unit_id IS NOT NULL THEN
    INSERT INTO public.audit_log (actor_id, entity, entity_id, action, field, old_value, new_value, metadata)
    VALUES (auth.uid(), 'schools', NEW.id, 'insert', 'org_unit_id',
            NULL, NEW.org_unit_id::text,
            jsonb_build_object('school_name', NEW.name));
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_audit_schools_org_unit
AFTER INSERT OR UPDATE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.audit_school_org_unit();

CREATE OR REPLACE FUNCTION public.audit_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (actor_id, entity, entity_id, action, field, old_value, new_value, metadata)
    VALUES (auth.uid(), 'user_roles', OLD.user_id, 'delete', 'role', OLD.role::text, NULL,
            jsonb_build_object('school_id', OLD.school_id, 'org_unit_id', OLD.org_unit_id));
    RETURN OLD;
  END IF;
  INSERT INTO public.audit_log (actor_id, entity, entity_id, action, field, old_value, new_value, metadata)
  VALUES (auth.uid(), 'user_roles', NEW.user_id, lower(TG_OP), 'role',
          CASE WHEN TG_OP = 'UPDATE' THEN OLD.role::text ELSE NULL END, NEW.role::text,
          jsonb_build_object('school_id', NEW.school_id, 'org_unit_id', NEW.org_unit_id));
  RETURN NEW;
END $$;

CREATE TRIGGER trg_audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles();
-- ============================================================
-- FASE 1 — Hierarquia organizacional + RBAC hierárquico
-- Estritamente aditiva. Rollback documentado em docs/.
-- ============================================================

-- 1) Tipo de unidade organizacional
DO $$ BEGIN
  CREATE TYPE public.org_unit_type AS ENUM ('secretaria','subsecretaria','regional','distrito');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Novos perfis (aditivo ao enum existente)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretario';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'subsecretario';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_regional';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor_distrital';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordenador';

-- 3) Tabela de unidades organizacionais
CREATE TABLE IF NOT EXISTS public.org_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.org_units(id) ON DELETE RESTRICT,
  type public.org_unit_type NOT NULL,
  name text NOT NULL,
  short_name text,
  code text UNIQUE,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.org_units TO authenticated;
GRANT ALL ON public.org_units TO service_role;
ALTER TABLE public.org_units ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_org_units_parent ON public.org_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_org_units_type ON public.org_units(type);

DROP TRIGGER IF EXISTS trg_org_units_updated ON public.org_units;
CREATE TRIGGER trg_org_units_updated BEFORE UPDATE ON public.org_units
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Impede ciclos na hierarquia
CREATE OR REPLACE FUNCTION public.org_units_no_cycle()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE cur uuid; depth int := 0;
BEGIN
  IF NEW.parent_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.parent_id = NEW.id THEN RAISE EXCEPTION 'org_units: unidade nao pode ser pai de si mesma'; END IF;
  cur := NEW.parent_id;
  WHILE cur IS NOT NULL AND depth < 20 LOOP
    IF cur = NEW.id THEN RAISE EXCEPTION 'org_units: ciclo detectado na hierarquia'; END IF;
    SELECT parent_id INTO cur FROM public.org_units WHERE id = cur;
    depth := depth + 1;
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_org_units_no_cycle ON public.org_units;
CREATE TRIGGER trg_org_units_no_cycle BEFORE INSERT OR UPDATE ON public.org_units
  FOR EACH ROW EXECUTE FUNCTION public.org_units_no_cycle();

-- 4) Escolas: vínculo hierárquico + cadastro completo
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS inep_code text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS modalities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS shifts text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uq_schools_inep ON public.schools(inep_code) WHERE inep_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_org_unit ON public.schools(org_unit_id);

DROP TRIGGER IF EXISTS trg_schools_updated ON public.schools;
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) user_roles: escopo por escola OU por unidade organizacional
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS org_unit_id uuid REFERENCES public.org_units(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles ALTER COLUMN school_id DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_scope_chk
    CHECK (school_id IS NOT NULL OR org_unit_id IS NOT NULL OR role = 'superadmin'::public.app_role);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_unit ON public.user_roles(org_unit_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_school ON public.user_roles(school_id);

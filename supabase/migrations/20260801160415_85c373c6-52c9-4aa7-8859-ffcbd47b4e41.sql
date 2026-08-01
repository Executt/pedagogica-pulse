-- 1. superadmin helper
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'::app_role
  );
$$;

-- superadmin enxerga todas as escolas
CREATE OR REPLACE FUNCTION public.has_school_access(_school_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_superadmin(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND school_id = _school_id
  );
$$;

-- 2. configurações da integração
CREATE TABLE public.configuracoes_integracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_integracao TO authenticated;
GRANT ALL ON public.configuracoes_integracao TO service_role;
ALTER TABLE public.configuracoes_integracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integracao select superadmin" ON public.configuracoes_integracao
  FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "integracao insert superadmin" ON public.configuracoes_integracao
  FOR INSERT TO authenticated WITH CHECK (public.is_superadmin(auth.uid()));
CREATE POLICY "integracao update superadmin" ON public.configuracoes_integracao
  FOR UPDATE TO authenticated USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- 3. logs de diagnóstico
CREATE TABLE public.logs_integracao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  direction text NOT NULL DEFAULT 'outbound',
  resource text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  status integer,
  signature_ok boolean,
  ts_used text,
  nonce_used text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.logs_integracao TO authenticated;
GRANT ALL ON public.logs_integracao TO service_role;
ALTER TABLE public.logs_integracao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "logs select superadmin" ON public.logs_integracao
  FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));

CREATE INDEX idx_logs_integracao_created_at ON public.logs_integracao (created_at DESC);

-- 4. onboarding: usuário pode se vincular a uma escola
CREATE POLICY "user_roles insert self" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_configuracoes_integracao_updated
  BEFORE UPDATE ON public.configuracoes_integracao
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
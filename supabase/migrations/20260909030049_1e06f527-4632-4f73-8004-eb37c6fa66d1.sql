CREATE TABLE IF NOT EXISTS public.conectores_integracao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('pulse','rest','soap','sftp')),
  base_url text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  secret text,
  ativo boolean NOT NULL DEFAULT true,
  ultimo_status integer,
  ultimo_teste_em timestamptz,
  ultimo_erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conectores_integracao TO authenticated;
GRANT ALL ON public.conectores_integracao TO service_role;

ALTER TABLE public.conectores_integracao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "superadmin gerencia conectores" ON public.conectores_integracao;
CREATE POLICY "superadmin gerencia conectores" ON public.conectores_integracao
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

CREATE OR REPLACE FUNCTION public.set_updated_at_conectores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conectores_integracao_updated_at ON public.conectores_integracao;
CREATE TRIGGER conectores_integracao_updated_at
  BEFORE UPDATE ON public.conectores_integracao
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_conectores();

INSERT INTO public.conectores_integracao (slug, nome, tipo, base_url, config)
VALUES
  ('pulse', 'Inteligência Pedagógica (Pulse)', 'pulse', 'https://inteligenciapedagogica.lovable.app', '{"health_path":"/api/public/pulse/escolas"}'::jsonb),
  ('sei', 'SEI — Processo Eletrônico', 'soap', '', '{"wsdl_path":"/sei/ws/SeiWS.php?wsdl","sistema":"","unidade":""}'::jsonb),
  ('sftp', 'SFTP — Troca de arquivos', 'sftp', '', '{"host":"","port":22,"usuario":"","pasta":"/"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
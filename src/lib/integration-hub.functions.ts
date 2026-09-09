/**
 * Integration Hub — cadastro, teste e diagnóstico dos conectores externos.
 * Toda credencial fica no backend; o app só recebe o valor mascarado.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ConnectorKind = "pulse" | "rest" | "soap" | "sftp";

export type ConnectorView = {
  id: string;
  slug: string;
  nome: string;
  tipo: ConnectorKind;
  base_url: string | null;
  config: Record<string, unknown>;
  ativo: boolean;
  ultimo_status: number | null;
  ultimo_teste_em: string | null;
  ultimo_erro: string | null;
  updated_at: string;
  secretMasked: string | null;
};

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/),
  nome: z.string().trim().min(2).max(120),
  tipo: z.enum(["pulse", "rest", "soap", "sftp"]),
  baseUrl: z.string().trim().max(300).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  secret: z.string().trim().max(500).optional(),
  ativo: z.boolean().optional(),
});

async function assertSuperadmin(supabase: { rpc: (fn: string, args?: unknown) => Promise<{ data: unknown }> }) {
  const { data } = await supabase.rpc("is_superadmin");
  if (data !== true) throw new Error("Apenas superadmin pode gerenciar integrações.");
}

function mask(secret: string | null) {
  if (!secret) return null;
  return secret.length <= 8 ? "••••" : `${secret.slice(0, 6)}••••${secret.slice(-4)}`;
}

function toView(row: Record<string, any>): ConnectorView {
  const { secret, ...rest } = row;
  return { ...(rest as ConnectorView), secretMasked: mask(secret ?? null) };
}

export const listConnectors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperadmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("conectores_integracao")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return { connectors: [] as ConnectorView[], error: error.message };
    return { connectors: (data ?? []).map(toView), error: null as string | null };
  });

export const saveConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const row: Record<string, unknown> = {
      slug: data.slug,
      nome: data.nome,
      tipo: data.tipo,
      base_url: data.baseUrl ?? "",
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    };
    if (data.config) row['config'] = data.config;
    if (typeof data.ativo === "boolean") row['ativo'] = data.ativo;
    if (data.secret) row['secret'] = data.secret;

    const { error } = await supabaseAdmin
      .from("conectores_integracao")
      .upsert(row, { onConflict: "slug" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

export const deleteConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("conectores_integracao").delete().eq("id", data.id);
    return { ok: !error, error: error?.message ?? null };
  });

/** Testa o alcance/credencial do conector e registra o resultado. */
export const testConnector = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("conectores_integracao")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error || !row) return { ok: false, status: 0, detail: "Conector não encontrado." };

    const result = await runTest(row as never);

    await supabaseAdmin
      .from("conectores_integracao")
      .update({
        ultimo_status: result.status,
        ultimo_teste_em: new Date().toISOString(),
        ultimo_erro: result.ok ? null : result.detail,
      })
      .eq("id", data.id);

    await supabaseAdmin.from("logs_integracao").insert({
      resource: `hub:${row['slug']}`,
      method: "TEST",
      status: result.status,
      signature_ok: result.signed,
      error: result.ok ? null : result.detail,
    });

    return result;
  });

type TestResult = { ok: boolean; status: number; detail: string; signed: boolean };

async function runTest(row: {
  slug: string;
  tipo: ConnectorKind;
  base_url: string | null;
  config: Record<string, any> | null;
  secret: string | null;
}): Promise<TestResult> {
  const base = (row.base_url ?? "").replace(/\/+$/, "");
  const cfg = row.config ?? {};

  if (row.tipo === "sftp") {
    return {
      ok: false,
      status: 0,
      detail:
        "Conexão SFTP usa SSH e não pode ser aberta pelo servidor do app. Configure uma ponte HTTP (serviço intermediário) e cadastre-a como conector REST.",
      signed: false,
    };
  }

  if (row.tipo === "pulse") {
    const { checkPulseConnection } = await import("@/lib/pulse-read.functions");
    const r: any = await checkPulseConnection();
    return {
      ok: r?.connected === true,
      status: Number(r?.status ?? 0),
      detail: r?.connected
        ? r?.readAvailable
          ? "Envio e leitura ativos."
          : "Envio ativo; rotas de leitura ainda indisponíveis no sistema remoto."
        : (r?.reason ?? "Sem resposta do sistema remoto."),
      signed: r?.signed === true,
    };
  }

  if (!base) return { ok: false, status: 0, detail: "Informe o endereço (URL) do serviço.", signed: false };

  const path = row.tipo === "soap" ? (cfg['wsdl_path'] ?? "") : (cfg['health_path'] ?? "/");
  const url = `${base}${String(path).startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { accept: "*/*" };
  if (row.secret) headers['authorization'] = `Bearer ${row.secret}`;

  try {
    const res = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(10_000) });
    return {
      ok: res.ok,
      status: res.status,
      detail: res.ok ? `Serviço respondeu ${res.status}.` : `Serviço respondeu ${res.status}.`,
      signed: Boolean(row.secret),
    };
  } catch (e: any) {
    return { ok: false, status: 0, detail: e?.message ?? "Falha de rede.", signed: Boolean(row.secret) };
  }
}

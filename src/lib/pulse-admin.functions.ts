import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaveSchema = z.object({
  token: z.string().trim().min(12).max(400).optional(),
  baseUrl: z.string().trim().url().max(300).optional(),
});

async function assertSuperadmin(supabase: { rpc: (fn: string, args?: unknown) => Promise<{ data: unknown }> }) {
  const { data } = await supabase.rpc("is_superadmin");
  if (data !== true) throw new Error("Apenas superadmin pode alterar a integração.");
}

/** Diz se o usuário atual é superadmin (controla a tela de configuração). */
export const amISuperadmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("is_superadmin");
    return { superadmin: data === true };
  });

/** Metadados do token (nunca devolve o valor completo). */
export const getPulseSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperadmin(context.supabase as never);
    const { pulseConfigAsync } = await import("@/lib/pulse.server");
    const { token, base, source } = await pulseConfigAsync();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("configuracoes_integracao")
      .select("key, updated_at")
      .eq("key", "PULSE_API_TOKEN")
      .maybeSingle();
    return {
      baseUrl: base,
      tokenSource: source,
      tokenMasked: token ? `${token.slice(0, 10)}••••${token.slice(-4)}` : null,
      updatedAt: data?.updated_at ?? null,
    };
  });

/** Salva/rotaciona o token e a URL da integração (somente superadmin). */
export const savePulseSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => SaveSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never);
    const rows = [
      ...(data.token ? [{ key: "PULSE_API_TOKEN", value: data.token }] : []),
      ...(data.baseUrl ? [{ key: "PULSE_API_URL", value: data.baseUrl }] : []),
    ].map((r) => ({ ...r, updated_by: context.userId, updated_at: new Date().toISOString() }));
    if (rows.length === 0) return { ok: false, error: "nothing_to_save" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("configuracoes_integracao")
      .upsert(rows, { onConflict: "key" });
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null as string | null };
  });

/** Últimos eventos técnicos da integração (modo diagnóstico). */
export const getPulseLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("logs_integracao")
      .select("id, resource, method, status, signature_ok, ts_used, nonce_used, error, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return { logs: [] as never[] };
    return { logs: data ?? [] };
  });

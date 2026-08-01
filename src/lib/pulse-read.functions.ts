import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RESOURCES = ["escolas", "turmas", "alunos", "registros", "observacoes", "agenda", "sugestoes"] as const;

const ResourceSchema = z.object({
  resource: z.enum(RESOURCES),
  schoolId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  since: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

/**
 * Testa a conectividade com o sistema Inteligência Pedagógica.
 * Separa dois estados: escrita (ingest) e leitura (rotas de consulta).
 */
export const checkPulseConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { pulseFetch, pulseConfigAsync } = await import("@/lib/pulse.server");
    const { base, token, source } = await pulseConfigAsync();
    if (!token) {
      return {
        connected: false,
        readAvailable: false,
        base,
        tokenSource: source,
        status: 0,
        reason: "missing_config" as string | null,
        ts: null as string | null,
        nonce: null as string | null,
        signed: false,
      };
    }

    const write = await pulseFetch("/api/public/pulse/ingest");
    const read = await pulseFetch("/api/public/pulse/escolas?limit=1");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("logs_integracao").insert([
      {
        user_id: context.userId,
        resource: "ingest(ping)",
        method: "GET",
        status: write.status,
        signature_ok: write.ok,
        ts_used: write.ts,
        nonce_used: write.nonce,
        error: write.ok ? null : (write.error ?? null),
      },
      {
        user_id: context.userId,
        resource: "escolas(ping)",
        method: "GET",
        status: read.status,
        signature_ok: read.ok,
        ts_used: read.ts,
        nonce_used: read.nonce,
        error: read.ok ? null : (read.error ?? null),
      },
    ]);

    return {
      connected: write.ok,
      readAvailable: read.ok,
      base,
      tokenSource: source,
      status: write.status,
      reason: write.ok ? (read.ok ? null : (read.unavailable ? "read_unavailable" : (read.error ?? null))) : (write.error ?? "unreachable"),
      ts: write.ts,
      nonce: write.nonce,
      signed: write.signed,
    };
  });

/**
 * Lê uma coleção do sistema remoto. Se a rota ainda não existir (404),
 * devolve `unavailable: true` para a UI cair no fallback local/mock.
 */
export const fetchPulseResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ResourceSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { pulseFetch } = await import("@/lib/pulse.server");
    const params = new URLSearchParams();
    if (data.schoolId) params.set("school_id", data.schoolId);
    if (data.classId) params.set("class_id", data.classId);
    if (data.studentId) params.set("student_id", data.studentId);
    if (data.since) params.set("since", data.since);
    params.set("limit", String(data.limit ?? 100));

    const res = await pulseFetch<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(
      `/api/public/pulse/${data.resource}?${params.toString()}`,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("logs_integracao").insert({
      user_id: context.userId,
      resource: data.resource,
      method: "GET",
      status: res.status,
      signature_ok: res.ok,
      ts_used: res.ts,
      nonce_used: res.nonce,
      error: res.ok ? null : (res.error ?? null),
    });

    if (!res.ok) {
      return {
        ok: false,
        unavailable: res.unavailable ?? false,
        error: res.error ?? null,
        itemsJson: "[]",
        fetchedAt: new Date().toISOString(),
      };
    }
    const items = Array.isArray(res.data) ? res.data : ((res.data as { data?: Record<string, unknown>[] })?.data ?? []);
    return {
      ok: true,
      unavailable: false,
      error: null as string | null,
      itemsJson: JSON.stringify(items),
      fetchedAt: new Date().toISOString(),
    };
  });

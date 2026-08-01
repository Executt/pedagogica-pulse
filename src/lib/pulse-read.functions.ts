import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ResourceSchema = z.object({
  resource: z.enum(["schools", "classes", "students", "observations", "materials", "events", "users"]),
  schoolId: z.string().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

/** Testa a conectividade com o sistema Inteligência Pedagógica. */
export const checkPulseConnection = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { pulseFetch, pulseConfig } = await import("@/lib/pulse.server");
    const { base, token } = pulseConfig();
    if (!token) return { connected: false, base, reason: "missing_config" as const };
    const res = await pulseFetch("/api/public/pulse/ingest");
    return {
      connected: res.ok,
      base,
      status: res.status,
      reason: res.ok ? null : (res.error ?? "unreachable"),
    };
  });

/**
 * Lê uma coleção do sistema remoto. Enquanto o sistema não expõe rotas de
 * leitura, devolve `unavailable: true` para a UI cair no fallback local/mock.
 */
export const fetchPulseResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ResourceSchema.parse(input))
  .handler(async ({ data }) => {
    const { pulseFetch } = await import("@/lib/pulse.server");
    const params = new URLSearchParams();
    if (data.schoolId) params.set("school_id", data.schoolId);
    params.set("limit", String(data.limit ?? 100));
    const res = await pulseFetch<{ data?: Record<string, unknown>[] } | Record<string, unknown>[]>(
      `/api/public/pulse/${data.resource}?${params.toString()}`,
    );
    if (!res.ok) {
      return { ok: false, unavailable: res.unavailable ?? false, error: res.error ?? null, itemsJson: "[]" };
    }
    const items = Array.isArray(res.data) ? res.data : ((res.data as { data?: Record<string, unknown>[] })?.data ?? []);
    // Serializado como JSON para atravessar o boundary RPC com segurança.
    return { ok: true, unavailable: false, error: null, itemsJson: JSON.stringify(items) };
  });

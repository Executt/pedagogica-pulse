import { verifyPulseRequest } from "@/lib/pulse.server";

export type PulseResource = "escolas" | "turmas" | "alunos" | "registros" | "observacoes" | "agenda" | "sugestoes";

const SELECT: Record<PulseResource, { table: string; columns: string; order: string; ascending?: boolean }> = {
  escolas: { table: "schools", columns: "id, name, city, created_at", order: "name", ascending: true },
  turmas: { table: "classes", columns: "id, school_id, name, grade, year, teacher_id, created_at", order: "name", ascending: true },
  alunos: {
    table: "students",
    columns:
      "id, class_id, full_name, birthdate, guardian_name, has_pei, risk, attendance_rate, created_at",
    order: "full_name",
    ascending: true,
  },
  registros: {
    table: "materials",
    columns:
      "id, school_id, class_id, student_id, name, description, mime_type, size_bytes, tags, duration_seconds, time_range_start, time_range_end, external_id, synced_at, created_at",
    order: "created_at",
  },
  observacoes: { table: "observations", columns: "id, student_id, type, content, sentiment, created_at", order: "created_at" },
  agenda: { table: "events", columns: "id, school_id, class_id, student_id, title, description, location, starts_at, ends_at, created_at", order: "starts_at" },
  sugestoes: { table: "ai_suggestions", columns: "id, school_id, class_id, student_id, type, title, description, status, created_at", order: "created_at" },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/**
 * Handler genérico das rotas públicas GET /api/public/pulse/<recurso>.
 * Exige Bearer token + assinatura HMAC (mesmo esquema do ingest).
 */
export async function servePulseResource(resource: PulseResource, request: Request): Promise<Response> {
  const auth = await verifyPulseRequest(request, "");
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);
  const since = url.searchParams.get("since");
  const schoolId = url.searchParams.get("school_id");
  const classId = url.searchParams.get("class_id");
  const studentId = url.searchParams.get("student_id");

  const cfg = SELECT[resource];
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let q = supabaseAdmin.from(cfg.table).select(cfg.columns).limit(limit);
  q = q.order(cfg.order, { ascending: cfg.ascending ?? false });
  if (schoolId && ["schools", "classes", "materials", "events", "ai_suggestions"].includes(cfg.table)) {
    q = cfg.table === "schools" ? q.eq("id", schoolId) : q.eq("school_id", schoolId);
  }
  if (classId && ["classes", "students", "materials", "events", "ai_suggestions"].includes(cfg.table)) {
    q = cfg.table === "classes" ? q.eq("id", classId) : q.eq("class_id", classId);
  }
  if (studentId && ["students", "materials", "events", "observations", "ai_suggestions"].includes(cfg.table)) {
    q = cfg.table === "students" ? q.eq("id", studentId) : q.eq("student_id", studentId);
  }
  if (since) q = q.gte("created_at", since);

  const { data, error } = await q;
  if (error) return json({ ok: false, error: error.message }, 500);

  const items = data ?? [];
  // ETag simples: permite ao cliente pular atualização quando nada mudou.
  const latest = items.reduce<string>((acc, row) => {
    const v = (row as Record<string, unknown>)["created_at"];
    return typeof v === "string" && v > acc ? v : acc;
  }, "");
  const etag = `W/"${resource}-${items.length}-${latest}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { etag } });
  }

  return new Response(JSON.stringify({ ok: true, resource, count: items.length, data: items }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store", etag },
  });
}

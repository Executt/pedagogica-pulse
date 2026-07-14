import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({ materialId: z.string().uuid() });

/**
 * Sincroniza um registro (material) com o sistema externo
 * "Inteligência Pedagógica" via endpoint público de ingest.
 *
 * Requer as secrets PULSE_INGEST_URL e PULSE_INGEST_TOKEN.
 * Enquanto o endpoint remoto não existir, marca o material com o erro
 * retornado para que a UI mostre o status corretamente.
 */
export const syncMaterialToPulse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: material, error } = await supabase
      .from("materials")
      .select("*, classes(name), students(full_name), schools(name)")
      .eq("id", data.materialId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!material) throw new Error("Registro não encontrado");

    const url = process.env.PULSE_INGEST_URL;
    const token = process.env.PULSE_INGEST_TOKEN;
    if (!url || !token) {
      return { ok: false, reason: "missing_config" as const };
    }

    // Signed URL do arquivo para o sistema externo baixar
    const { data: signed } = await supabase.storage
      .from("materials")
      .createSignedUrl(material.url, 60 * 60 * 24); // 24h

    const payload = {
      event_type: "material.created",
      external_id: material.id,
      source: "mobile-app",
      uploaded_by: userId,
      payload: {
        name: material.name,
        description: material.description,
        mime_type: material.mime_type,
        size_bytes: material.size_bytes,
        duration_seconds: material.duration_seconds,
        time_range: {
          start: material.time_range_start,
          end: material.time_range_end,
        },
        tags: material.tags,
        school: { id: material.school_id, name: material.schools?.name },
        class: material.class_id ? { id: material.class_id, name: material.classes?.name } : null,
        student: material.student_id
          ? { id: material.student_id, full_name: material.students?.full_name }
          : null,
        file_url: signed?.signedUrl ?? null,
        storage_path: material.url,
        created_at: material.created_at,
      },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        const errMsg = `Ingest ${res.status}: ${body.slice(0, 300)}`;
        await supabase
          .from("materials")
          .update({ sync_error: errMsg, synced_at: null })
          .eq("id", material.id);
        return { ok: false, status: res.status, error: errMsg };
      }

      let external_id: string | null = null;
      try {
        const json = (await res.json()) as { id?: string; external_id?: string };
        external_id = json.external_id ?? json.id ?? null;
      } catch {
        /* endpoint pode não retornar JSON */
      }

      await supabase
        .from("materials")
        .update({
          synced_at: new Date().toISOString(),
          sync_error: null,
          external_id,
        })
        .eq("id", material.id);

      return { ok: true, external_id };
    } catch (e: any) {
      const errMsg = e?.message ?? "network_error";
      await supabase
        .from("materials")
        .update({ sync_error: errMsg, synced_at: null })
        .eq("id", material.id);
      return { ok: false, error: errMsg };
    }
  });
/** INFRAESTRUTURA — implementação Supabase do port de Organização. */
import { supabase } from "@/integrations/supabase/client";
import type {
  AuditEntry,
  ImportRunInput,
  ImportRunRecord,
  MyScope,
  OrgRepository,
  OrgUnitInput,
  SchoolUpsert,
} from "@/application/ports/org-repository";
import type { OrgUnit, School } from "@/domain/org/types";
import type { AppRole } from "@/domain/rbac/roles";

export const supabaseOrgRepository: OrgRepository = {
  async listUnits(): Promise<OrgUnit[]> {
    const { data, error } = await supabase
      .from("org_units")
      .select("id, parent_id, type, name, short_name, code, active")
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as OrgUnit[];
  },

  async listSchools(): Promise<School[]> {
    const { data, error } = await supabase.from("schools").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as unknown as School[];
  },

  async myScope(): Promise<MyScope> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return { roles: [], schoolIds: [], orgUnitIds: [] };
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, school_id, org_unit_id")
      .eq("user_id", auth.user.id);
    if (error) throw error;
    const rows = data ?? [];
    return {
      roles: rows.map((r) => r.role as AppRole),
      schoolIds: rows.map((r) => r.school_id).filter((v): v is string => Boolean(v)),
      orgUnitIds: rows.map((r) => r.org_unit_id).filter((v): v is string => Boolean(v)),
    };
  },

  async ensureUnit(input: OrgUnitInput): Promise<OrgUnit> {
    const existing = await supabase
      .from("org_units")
      .select("id, parent_id, type, name, short_name, code, active")
      .eq("name", input.name)
      .maybeSingle();
    if (existing.data) return existing.data as unknown as OrgUnit;

    const { data, error } = await supabase
      .from("org_units")
      .insert({
        name: input.name,
        type: input.type,
        parent_id: input.parent_id ?? null,
        short_name: input.short_name ?? null,
        code: input.code ?? null,
      })
      .select("id, parent_id, type, name, short_name, code, active")
      .single();
    if (error) throw error;
    return data as unknown as OrgUnit;
  },

  async upsertSchools(schools: SchoolUpsert[]) {
    let inserted = 0;
    let updated = 0;
    for (const s of schools) {
      const match = s.inep_code
        ? await supabase.from("schools").select("id").eq("inep_code", s.inep_code).maybeSingle()
        : await supabase.from("schools").select("id").eq("name", s.name).maybeSingle();

      if (match.data?.id) {
        const { error } = await supabase.from("schools").update(s).eq("id", match.data.id);
        if (error) throw error;
        updated++;
      } else {
        const { error } = await supabase.from("schools").insert(s);
        if (error) throw error;
        inserted++;
      }
    }
    return { inserted, updated };
  },

  async saveImportRun(input: ImportRunInput): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sessão expirada.");
    const { error } = await supabase.from("import_runs").insert({
      user_id: auth.user.id,
      file_name: input.file_name,
      total_detected: input.total_detected,
      inserted_count: input.inserted_count,
      updated_count: input.updated_count,
      skipped_count: input.skipped_count,
      units_count: input.units_count,
      issues: input.issues,
    });
    if (error) throw error;
  },

  async listImportRuns(limit = 30): Promise<ImportRunRecord[]> {
    const { data, error } = await supabase
      .from("import_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as ImportRunRecord[];
  },

  async listAuditLog(limit = 50): Promise<AuditEntry[]> {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as AuditEntry[];
  },

  async recordAudit(input): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Sessão expirada.");
    const { error } = await supabase.from("audit_log").insert({
      actor_id: auth.user.id,
      entity: input.entity,
      entity_id: input.entity_id ?? null,
      action: input.action,
      field: input.field ?? null,
      old_value: input.old_value ?? null,
      new_value: input.new_value ?? null,
      metadata: (input.metadata ?? {}) as never,
    });
    if (error) throw error;
  },
};
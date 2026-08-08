import type { OrgUnit, OrgUnitType, School } from "@/domain/org/types";
import type { AppRole } from "@/domain/rbac/roles";

export type MyScope = {
  roles: AppRole[];
  schoolIds: string[];
  orgUnitIds: string[];
};

export type OrgUnitInput = {
  name: string;
  type: OrgUnitType;
  parent_id?: string | null;
  short_name?: string | null;
  code?: string | null;
};

export type SchoolUpsert = Omit<School, "id"> & { id?: string };

export type ImportIssueRecord = {
  school: string;
  field: string;
  message: string;
  severity: "erro" | "aviso";
};

export type ImportRunInput = {
  file_name: string;
  total_detected: number;
  inserted_count: number;
  updated_count: number;
  skipped_count: number;
  units_count: number;
  issues: ImportIssueRecord[];
};

export type ImportRunRecord = ImportRunInput & {
  id: string;
  user_id: string;
  created_at: string;
};

export type AuditEntry = {
  id: string;
  actor_id: string | null;
  entity: string;
  entity_id: string | null;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AuditRecordInput = {
  entity: string;
  entity_id?: string | null;
  action: string;
  field?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  metadata?: Record<string, unknown>;
};

export interface OrgRepository {
  listUnits(): Promise<OrgUnit[]>;
  listSchools(): Promise<School[]>;
  myScope(): Promise<MyScope>;
  ensureUnit(input: OrgUnitInput): Promise<OrgUnit>;
  upsertSchools(schools: SchoolUpsert[]): Promise<{ inserted: number; updated: number }>;
  saveImportRun(input: ImportRunInput): Promise<void>;
  listImportRuns(limit?: number): Promise<ImportRunRecord[]>;
  listAuditLog(limit?: number): Promise<AuditEntry[]>;
  recordAudit(input: AuditRecordInput): Promise<void>;
}
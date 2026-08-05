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

export interface OrgRepository {
  listUnits(): Promise<OrgUnit[]>;
  listSchools(): Promise<School[]>;
  myScope(): Promise<MyScope>;
  ensureUnit(input: OrgUnitInput): Promise<OrgUnit>;
  upsertSchools(schools: SchoolUpsert[]): Promise<{ inserted: number; updated: number }>;
}
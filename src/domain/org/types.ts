/**
 * DOMÍNIO — Contexto "Organização" (rede municipal).
 * Sem React, sem Supabase.
 */

export type OrgUnitType = "secretaria" | "subsecretaria" | "regional" | "distrito";

export const ORG_UNIT_LEVEL: Record<OrgUnitType, number> = {
  secretaria: 0,
  subsecretaria: 1,
  regional: 2,
  distrito: 3,
};

export const ORG_UNIT_LABEL: Record<OrgUnitType, string> = {
  secretaria: "Secretaria",
  subsecretaria: "Subsecretaria",
  regional: "Regional",
  distrito: "Distrito",
};

export type OrgUnit = {
  id: string;
  parent_id: string | null;
  type: OrgUnitType;
  name: string;
  short_name?: string | null;
  code?: string | null;
  active: boolean;
};

export type OrgUnitNode = OrgUnit & { children: OrgUnitNode[]; depth: number };

export type School = {
  id: string;
  name: string;
  city?: string | null;
  org_unit_id?: string | null;
  inep_code?: string | null;
  cnpj?: string | null;
  address?: string | null;
  district?: string | null;
  postal_code?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  modalities?: string[];
  shifts?: string[];
  capacity?: number | null;
  active?: boolean;
};
/** DOMÍNIO — filtros hierárquicos (Secretaria→Regional→Distrito→Escola). */
import { descendantIds } from "./rules";
import type { OrgUnit, School } from "./types";

/** Escolas pertencentes à unidade e a todas as suas subordinadas. */
export function schoolsInUnit(
  units: OrgUnit[],
  schools: School[],
  unitId: string | null,
): School[] {
  if (!unitId) return schools;
  const ids = new Set(descendantIds(units, unitId));
  return schools.filter((s) => (s.org_unit_id ? ids.has(s.org_unit_id) : false));
}

/** IDs de escola visíveis para o filtro atual (unidade + escola específica). */
export function scopedSchoolIds(
  units: OrgUnit[],
  schools: School[],
  filter: { unitId: string | null; schoolId: string | null },
): string[] {
  if (filter.schoolId) return [filter.schoolId];
  return schoolsInUnit(units, schools, filter.unitId).map((s) => s.id);
}

/** Mantém apenas itens cuja escola está no escopo. Sem filtro → tudo. */
export function filterBySchoolScope<T extends { school_id?: string | null }>(
  items: T[],
  filter: { unitId: string | null; schoolId: string | null },
  allowedSchoolIds: string[],
): T[] {
  if (!filter.unitId && !filter.schoolId) return items;
  const allowed = new Set(allowedSchoolIds);
  return items.filter((i) => (i.school_id ? allowed.has(i.school_id) : false));
}
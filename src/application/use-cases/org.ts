import type { MyScope, OrgRepository, SchoolUpsert } from "@/application/ports/org-repository";
import { buildOrgTree, flattenOrgTree } from "@/domain/org/rules";
import type { OrgUnit, OrgUnitNode, OrgUnitType, School } from "@/domain/org/types";
import { isImportable, type SchoolCandidate } from "@/domain/import/school-pdf";

export async function listOrgUnits(repo: OrgRepository): Promise<OrgUnit[]> {
  return repo.listUnits();
}

export async function getOrgTree(repo: OrgRepository): Promise<OrgUnitNode[]> {
  return buildOrgTree(await repo.listUnits());
}

export async function getFlatOrgTree(repo: OrgRepository): Promise<OrgUnitNode[]> {
  return flattenOrgTree(await getOrgTree(repo));
}

export async function listSchools(repo: OrgRepository): Promise<School[]> {
  return repo.listSchools();
}

export async function getMyScope(repo: OrgRepository): Promise<MyScope> {
  return repo.myScope();
}

/**
 * Importa candidatos aprovados na revisão manual:
 * cria/reaproveita as unidades organizacionais e faz upsert das escolas.
 */
export async function importSchoolCandidates(
  repo: OrgRepository,
  candidates: SchoolCandidate[],
  opts: { rootUnitId?: string | null } = {},
): Promise<{ inserted: number; updated: number; skipped: number; units: number }> {
  const approved = candidates.filter(isImportable);
  const skipped = candidates.length - approved.length;

  const unitIdByName = new Map<string, string>();
  const uniqueUnits = new Map<string, OrgUnitType>();
  approved.forEach((c) => {
    if (c.orgUnitName) uniqueUnits.set(c.orgUnitName, c.orgUnitType ?? "regional");
  });

  for (const [name, type] of uniqueUnits) {
    const unit = await repo.ensureUnit({ name, type, parent_id: opts.rootUnitId ?? null });
    unitIdByName.set(name, unit.id);
  }

  const payload: SchoolUpsert[] = approved.map((c) => ({
    name: c.name,
    inep_code: c.inep_code,
    cnpj: c.cnpj,
    address: c.address,
    postal_code: c.postal_code,
    phone: c.phone,
    email: c.email,
    capacity: c.capacity,
    shifts: c.shifts,
    modalities: c.modalities,
    org_unit_id: c.orgUnitName ? (unitIdByName.get(c.orgUnitName) ?? null) : null,
    active: true,
  }));

  const res = await repo.upsertSchools(payload);
  return { ...res, skipped, units: uniqueUnits.size };
}
/**
 * DOMÍNIO — Apoio à revisão manual do importador:
 * agrupamentos para ações em lote e comparação lado a lado (PDF × base atual).
 */
import type { School } from "@/domain/org/types";
import { normalizeName, type SchoolCandidate, type Severity } from "@/domain/import/school-pdf";

export type IssueGroup = { field: string; severity: Severity; count: number; keys: string[] };
export type UnitGroup = { unit: string; count: number; keys: string[] };

/** Agrupa candidatos por tipo de inconsistência (campo + severidade). */
export function groupIssuesByType(candidates: SchoolCandidate[]): IssueGroup[] {
  const map = new Map<string, IssueGroup>();
  candidates.forEach((c) => {
    c.issues.forEach((i) => {
      const id = `${i.field}::${i.severity}`;
      const g = map.get(id) ?? { field: i.field, severity: i.severity, count: 0, keys: [] };
      if (!g.keys.includes(c.key)) {
        g.keys.push(c.key);
        g.count++;
      }
      map.set(id, g);
    });
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Agrupa candidatos pela hierarquia detectada (regional/distrito). */
export function groupByUnit(candidates: SchoolCandidate[]): UnitGroup[] {
  const map = new Map<string, UnitGroup>();
  candidates.forEach((c) => {
    const unit = c.orgUnitName ?? "Sem unidade";
    const g = map.get(unit) ?? { unit, count: 0, keys: [] };
    g.keys.push(c.key);
    g.count++;
    map.set(unit, g);
  });
  return [...map.values()].sort((a, b) => a.unit.localeCompare(b.unit, "pt-BR"));
}

/** Encontra a escola já existente correspondente (INEP tem prioridade sobre nome). */
export function matchExistingSchool(
  candidate: SchoolCandidate,
  schools: School[],
): School | null {
  if (candidate.inep_code) {
    const byInep = schools.find((s) => s.inep_code && s.inep_code === candidate.inep_code);
    if (byInep) return byInep;
  }
  const nk = normalizeName(candidate.name);
  return schools.find((s) => normalizeName(s.name) === nk) ?? null;
}

export type DiffRow = {
  field: string;
  label: string;
  extracted: string;
  current: string;
  changed: boolean;
};

const FIELDS: { key: keyof SchoolCandidate & string; label: string; school: keyof School }[] = [
  { key: "name", label: "Nome", school: "name" },
  { key: "inep_code", label: "INEP", school: "inep_code" },
  { key: "cnpj", label: "CNPJ", school: "cnpj" },
  { key: "address", label: "Endereço", school: "address" },
  { key: "postal_code", label: "CEP", school: "postal_code" },
  { key: "phone", label: "Telefone", school: "phone" },
  { key: "email", label: "E-mail", school: "email" },
  { key: "capacity", label: "Capacidade", school: "capacity" },
  { key: "shifts", label: "Turnos", school: "shifts" },
  { key: "modalities", label: "Modalidades", school: "modalities" },
];

function show(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

/** Linhas de comparação PDF × base. Quando não há escola existente, é criação. */
export function diffCandidate(candidate: SchoolCandidate, existing: School | null): DiffRow[] {
  return FIELDS.map(({ key, label, school }) => {
    const extracted = show(candidate[key]);
    const current = existing ? show(existing[school]) : "—";
    return { field: key, label, extracted, current, changed: extracted !== current };
  });
}

export function changedRows(rows: DiffRow[]): DiffRow[] {
  return rows.filter((r) => r.changed && r.extracted !== "—");
}

/**
 * Aplica as decisões campo a campo: campos rejeitados voltam ao valor atual da
 * base (ou ficam vazios quando a escola ainda não existe). O nome nunca é
 * descartado quando não há escola correspondente.
 */
export function applyFieldDecisions(
  candidate: SchoolCandidate,
  existing: School | null,
  rejectedFields: string[],
): SchoolCandidate {
  if (rejectedFields.length === 0) return candidate;
  const next: SchoolCandidate = { ...candidate };
  FIELDS.forEach(({ key, school }) => {
    if (!rejectedFields.includes(key)) return;
    if (key === "name" && !existing) return;
    const fallback = existing ? existing[school] : null;
    const empty = Array.isArray(candidate[key]) ? [] : null;
    (next as Record<string, unknown>)[key] = fallback ?? empty;
  });
  return next;
}

export const COMPARABLE_FIELDS = FIELDS.map((f) => ({ key: f.key, label: f.label }));

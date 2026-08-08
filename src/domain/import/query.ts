/**
 * DOMÍNIO — Busca e ordenação para o histórico de importações,
 * suas inconsistências e a lista de candidatos em revisão.
 * Funções puras (sem I/O), fáceis de testar.
 */
import type { ImportIssueRecord, ImportRunRecord } from "@/application/ports/org-repository";
import type { SchoolCandidate } from "@/domain/import/school-pdf";

export type SortDir = "asc" | "desc";
export type RunSortBy = "date" | "file" | "issues" | "inserted";
export type CandidateSortBy = "name" | "issues" | "unit";

export const RUN_SORT_LABEL: Record<RunSortBy, string> = {
  date: "Data",
  file: "Arquivo",
  issues: "Inconsistências",
  inserted: "Criadas",
};

export const CANDIDATE_SORT_LABEL: Record<CandidateSortBy, string> = {
  name: "Nome",
  issues: "Inconsistências",
  unit: "Hierarquia",
};

function norm(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const dir = (d: SortDir) => (d === "asc" ? 1 : -1);

/** Busca por arquivo, data ou por qualquer texto das inconsistências da execução. */
export function searchImportRuns(runs: ImportRunRecord[], term: string): ImportRunRecord[] {
  const t = norm(term);
  if (!t) return runs;
  return runs.filter((r) => {
    const haystack = [
      r.file_name,
      new Date(r.created_at).toLocaleString("pt-BR"),
      ...r.issues.flatMap((i) => [i.school, i.field, i.message, i.severity]),
    ];
    return haystack.some((v) => norm(v).includes(t));
  });
}

export function sortImportRuns(
  runs: ImportRunRecord[],
  by: RunSortBy,
  d: SortDir = "desc",
): ImportRunRecord[] {
  const k = dir(d);
  return [...runs].sort((a, b) => {
    switch (by) {
      case "file":
        return k * a.file_name.localeCompare(b.file_name, "pt-BR");
      case "issues":
        return k * (a.issues.length - b.issues.length);
      case "inserted":
        return k * (a.inserted_count - b.inserted_count);
      default:
        return k * (Date.parse(a.created_at) - Date.parse(b.created_at));
    }
  });
}

/** Busca dentro da lista de inconsistências de uma execução. */
export function searchIssues(issues: ImportIssueRecord[], term: string): ImportIssueRecord[] {
  const t = norm(term);
  if (!t) return issues;
  return issues.filter((i) =>
    [i.school, i.field, i.message, i.severity].some((v) => norm(v).includes(t)),
  );
}

export function searchCandidates(candidates: SchoolCandidate[], term: string): SchoolCandidate[] {
  const t = norm(term);
  if (!t) return candidates;
  return candidates.filter((c) =>
    [
      c.name,
      c.inep_code,
      c.cnpj,
      c.address,
      c.orgUnitName,
      ...c.issues.flatMap((i) => [i.field, i.message, i.severity]),
    ].some((v) => norm(v).includes(t)),
  );
}

export function sortCandidates(
  candidates: SchoolCandidate[],
  by: CandidateSortBy,
  d: SortDir = "asc",
): SchoolCandidate[] {
  const k = dir(d);
  return [...candidates].sort((a, b) => {
    switch (by) {
      case "issues":
        return k * (a.issues.length - b.issues.length);
      case "unit":
        return k * norm(a.orgUnitName).localeCompare(norm(b.orgUnitName), "pt-BR");
      default:
        return k * a.name.localeCompare(b.name, "pt-BR");
    }
  });
}
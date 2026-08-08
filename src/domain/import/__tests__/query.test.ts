import { describe, it, expect } from "vitest";
import { searchImportRuns, sortImportRuns } from "@/domain/import/query";
import type { ImportRunRecord } from "@/application/ports/org-repository";

const base = {
  user_id: "u1",
  total_detected: 2,
  updated_count: 0,
  skipped_count: 0,
  units_count: 1,
};

const runs: ImportRunRecord[] = [
  {
    ...base,
    id: "1",
    file_name: "rede-2025.pdf",
    inserted_count: 5,
    issues: [{ school: "EMEF Sol", field: "inep_code", message: "INEP ausente", severity: "erro" }],
    created_at: "2026-01-01T10:00:00Z",
  },
  {
    ...base,
    id: "2",
    file_name: "anexo.pdf",
    inserted_count: 9,
    issues: [],
    created_at: "2026-02-01T10:00:00Z",
  },
];

describe("busca e ordenação do histórico", () => {
  it("busca por arquivo e por inconsistência", () => {
    expect(searchImportRuns(runs, "anexo").map((r) => r.id)).toEqual(["2"]);
    expect(searchImportRuns(runs, "inep ausente").map((r) => r.id)).toEqual(["1"]);
    expect(searchImportRuns(runs, "")).toHaveLength(2);
  });

  it("ordena por data e por criadas", () => {
    expect(sortImportRuns(runs, "date", "desc").map((r) => r.id)).toEqual(["2", "1"]);
    expect(sortImportRuns(runs, "inserted", "asc").map((r) => r.id)).toEqual(["1", "2"]);
  });
});
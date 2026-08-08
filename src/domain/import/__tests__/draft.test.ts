import { describe, it, expect } from "vitest";
import {
  applyDraft,
  bulkSelect,
  canUndo,
  createDraft,
  isFieldRejected,
  isSelected,
  rejectedCount,
  setFieldDecision,
  toggleSelection,
  undoDraft,
} from "@/domain/import/draft";

describe("draft de revisão", () => {
  it("registra histórico e desfaz a última ação", () => {
    let d = createDraft(["a"]);
    d = applyDraft(d, "aceitar b", (s) => toggleSelection(s, "b"));
    expect(isSelected(d.state, "b")).toBe(true);
    expect(canUndo(d)).toBe(true);
    d = undoDraft(d);
    expect(isSelected(d.state, "b")).toBe(false);
    expect(canUndo(d)).toBe(false);
  });

  it("aplica ações em lote e decisões campo a campo", () => {
    let d = createDraft();
    d = applyDraft(d, "lote", (s) => bulkSelect(s, ["a", "b"], true));
    expect(d.state.selected).toEqual(["a", "b"]);
    d = applyDraft(d, "rejeita inep", (s) => setFieldDecision(s, "a", "inep_code", false));
    expect(isFieldRejected(d.state, "a", "inep_code")).toBe(true);
    expect(rejectedCount(d.state)).toBe(1);
    d = applyDraft(d, "aceita inep", (s) => setFieldDecision(s, "a", "inep_code", true));
    expect(rejectedCount(d.state)).toBe(0);
  });
});
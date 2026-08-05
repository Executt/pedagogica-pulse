import { describe, expect, it } from "vitest";
import { can, isNetworkWide, widestScope } from "../roles";
import { buildOrgTree, descendantIds, orgUnitPath } from "@/domain/org/rules";
import type { OrgUnit } from "@/domain/org/types";

const units: OrgUnit[] = [
  { id: "sec", parent_id: null, type: "secretaria", name: "SME", active: true },
  { id: "reg", parent_id: "sec", type: "regional", name: "Regional Norte", active: true },
  { id: "dis", parent_id: "reg", type: "distrito", name: "Distrito 3", active: true },
];

describe("RBAC hierárquico", () => {
  it("superadmin mantém acesso total", () => {
    expect(isNetworkWide(["superadmin"])).toBe(true);
    expect(can(["superadmin"], "org:manage")).toBe(true);
    expect(can(["superadmin"], "integration:manage")).toBe(true);
  });

  it("professor não gerencia rede nem importa escolas", () => {
    expect(can(["professor"], "org:manage")).toBe(false);
    expect(can(["professor"], "school:import")).toBe(false);
    expect(can(["professor"], "student:view")).toBe(true);
  });

  it("usa o escopo mais amplo entre os papéis", () => {
    expect(widestScope(["professor", "gestor_regional"])).toBe("regional");
    expect(widestScope([])).toBeNull();
  });
});

describe("hierarquia organizacional", () => {
  it("monta a árvore a partir da secretaria", () => {
    const tree = buildOrgTree(units);
    expect(tree).toHaveLength(1);
    expect(tree[0].children[0].children[0].id).toBe("dis");
  });

  it("resolve descendentes de uma regional", () => {
    expect(descendantIds(units, "reg").sort()).toEqual(["dis", "reg"]);
  });

  it("gera o caminho legível", () => {
    expect(orgUnitPath(units, "dis")).toBe("SME › Regional Norte › Distrito 3");
  });
});
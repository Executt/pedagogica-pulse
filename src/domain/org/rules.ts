import { ORG_UNIT_LEVEL, type OrgUnit, type OrgUnitNode } from "./types";

/** Monta a árvore Secretaria → Subsecretaria → Regional → Distrito. */
export function buildOrgTree(units: OrgUnit[]): OrgUnitNode[] {
  const byId = new Map<string, OrgUnitNode>();
  units.forEach((u) => byId.set(u.id, { ...u, children: [], depth: 0 }));
  const roots: OrgUnitNode[] = [];
  byId.forEach((node) => {
    const parent = node.parent_id ? byId.get(node.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const setDepth = (n: OrgUnitNode, d: number) => {
    n.depth = d;
    n.children.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    n.children.forEach((c) => setDepth(c, d + 1));
  };
  roots.sort((a, b) => ORG_UNIT_LEVEL[a.type] - ORG_UNIT_LEVEL[b.type]);
  roots.forEach((r) => setDepth(r, 0));
  return roots;
}

/** Achata a árvore preservando a ordem hierárquica. */
export function flattenOrgTree(nodes: OrgUnitNode[]): OrgUnitNode[] {
  return nodes.flatMap((n) => [n, ...flattenOrgTree(n.children)]);
}

/** IDs da unidade e de todas as subordinadas. */
export function descendantIds(units: OrgUnit[], rootId: string): string[] {
  const childrenOf = new Map<string, string[]>();
  units.forEach((u) => {
    if (!u.parent_id) return;
    childrenOf.set(u.parent_id, [...(childrenOf.get(u.parent_id) ?? []), u.id]);
  });
  const out: string[] = [];
  const walk = (id: string) => {
    out.push(id);
    (childrenOf.get(id) ?? []).forEach(walk);
  };
  walk(rootId);
  return out;
}

/** Caminho legível até a raiz: "Secretaria › Regional Norte › Distrito 3". */
export function orgUnitPath(units: OrgUnit[], id: string): string {
  const byId = new Map(units.map((u) => [u.id, u]));
  const parts: string[] = [];
  let cur = byId.get(id);
  let guard = 0;
  while (cur && guard++ < 20) {
    parts.unshift(cur.short_name || cur.name);
    cur = cur.parent_id ? byId.get(cur.parent_id) : undefined;
  }
  return parts.join(" › ");
}
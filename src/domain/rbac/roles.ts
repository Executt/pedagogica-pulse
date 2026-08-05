/**
 * DOMÍNIO — RBAC hierárquico.
 * A autorização real é feita pelo banco (RLS + funções SECURITY DEFINER).
 * Esta camada apenas espelha as regras para habilitar/ocultar UI.
 */

export type AppRole =
  | "superadmin"
  | "secretario"
  | "subsecretario"
  | "gestor_regional"
  | "gestor_distrital"
  | "diretor"
  | "coordenador"
  | "pedagogo"
  | "professor";

export type ScopeLevel = "rede" | "subsecretaria" | "regional" | "distrito" | "escola" | "turma";

export const ROLE_LABEL: Record<AppRole, string> = {
  superadmin: "Superadministrador",
  secretario: "Secretário",
  subsecretario: "Subsecretário",
  gestor_regional: "Gestor regional",
  gestor_distrital: "Gestor distrital",
  diretor: "Diretor",
  coordenador: "Coordenador",
  pedagogo: "Pedagogo",
  professor: "Professor",
};

export const ROLE_SCOPE: Record<AppRole, ScopeLevel> = {
  superadmin: "rede",
  secretario: "rede",
  subsecretario: "subsecretaria",
  gestor_regional: "regional",
  gestor_distrital: "distrito",
  diretor: "escola",
  coordenador: "escola",
  pedagogo: "escola",
  professor: "turma",
};

const SCOPE_RANK: Record<ScopeLevel, number> = {
  rede: 0,
  subsecretaria: 1,
  regional: 2,
  distrito: 3,
  escola: 4,
  turma: 5,
};

export type Capability =
  | "org:manage"
  | "org:view"
  | "school:manage"
  | "school:import"
  | "integration:manage"
  | "class:view"
  | "student:view"
  | "record:create"
  | "suggestion:handle";

const CAPABILITIES: Record<Capability, AppRole[]> = {
  "org:manage": ["superadmin"],
  "org:view": ["superadmin", "secretario", "subsecretario", "gestor_regional", "gestor_distrital"],
  "school:manage": ["superadmin", "secretario", "subsecretario"],
  "school:import": ["superadmin", "secretario"],
  "integration:manage": ["superadmin"],
  "class:view": [
    "superadmin", "secretario", "subsecretario", "gestor_regional",
    "gestor_distrital", "diretor", "coordenador", "pedagogo", "professor",
  ],
  "student:view": [
    "superadmin", "secretario", "subsecretario", "gestor_regional",
    "gestor_distrital", "diretor", "coordenador", "pedagogo", "professor",
  ],
  "record:create": ["superadmin", "diretor", "coordenador", "pedagogo", "professor"],
  "suggestion:handle": ["superadmin", "diretor", "coordenador", "pedagogo"],
};

export function can(roles: AppRole[], capability: Capability): boolean {
  const allowed = CAPABILITIES[capability] ?? [];
  return roles.some((r) => allowed.includes(r));
}

/** Menor rank = maior alcance. Retorna o escopo mais amplo do usuário. */
export function widestScope(roles: AppRole[]): ScopeLevel | null {
  if (roles.length === 0) return null;
  return roles
    .map((r) => ROLE_SCOPE[r])
    .filter(Boolean)
    .sort((a, b) => SCOPE_RANK[a] - SCOPE_RANK[b])[0] ?? null;
}

export function isNetworkWide(roles: AppRole[]): boolean {
  return widestScope(roles) === "rede";
}
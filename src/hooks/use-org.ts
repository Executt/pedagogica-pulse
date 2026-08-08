/** INTERFACE — hooks de organização e RBAC. UI nunca chama Supabase direto. */
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabaseOrgRepository } from "@/infrastructure/supabase/org.repository";
import {
  getFlatOrgTree,
  getMyScope,
  listAuditTrail,
  listImportRuns,
  listSchools,
  recordAuditAction,
} from "@/application/use-cases/org";
import type { AuditRecordInput } from "@/application/ports/org-repository";
import { can, isNetworkWide, widestScope, type Capability } from "@/domain/rbac/roles";

const repo = supabaseOrgRepository;

export function useOrgTree() {
  return useQuery({ queryKey: ["org-tree"], queryFn: () => getFlatOrgTree(repo) });
}

export function useNetworkSchools() {
  return useQuery({ queryKey: ["org-schools"], queryFn: () => listSchools(repo) });
}

export function useMyScope() {
  return useQuery({ queryKey: ["my-scope"], queryFn: () => getMyScope(repo) });
}

export function useImportRuns() {
  return useQuery({ queryKey: ["import-runs"], queryFn: () => listImportRuns(repo) });
}

export function useAuditTrail() {
  return useQuery({ queryKey: ["audit-trail"], queryFn: () => listAuditTrail(repo) });
}

/** Registra ações do usuário (exportações, decisões de revisão) na auditoria. */
export function useAuditRecorder() {
  return useCallback((input: AuditRecordInput) => recordAuditAction(repo, input), []);
}

export function useRbac() {
  const scope = useMyScope();
  const roles = scope.data?.roles ?? [];
  return {
    isLoading: scope.isLoading,
    roles,
    scopeLevel: widestScope(roles),
    isNetworkWide: isNetworkWide(roles),
    can: (capability: Capability) => can(roles, capability),
  };
}

export const orgRepository = repo;
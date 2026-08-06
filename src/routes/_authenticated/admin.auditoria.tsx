import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { History, ShieldAlert, Building2, UserCog } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorRetry } from "@/components/query-state";
import { useAuditTrail, useNetworkSchools, useOrgTree, useRbac } from "@/hooks/use-org";
import { orgUnitPath } from "@/domain/org/rules";

export const Route = createFileRoute("/_authenticated/admin/auditoria")({
  head: () => ({
    meta: [
      { title: "Trilha de auditoria — Inteligência Pedagógica" },
      {
        name: "description",
        content: "Acompanhe alterações de unidade organizacional das escolas e atribuições de papéis de usuário.",
      },
      { property: "og:title", content: "Trilha de auditoria — Inteligência Pedagógica" },
      { property: "og:description", content: "Mudanças de escopo e de acesso registradas automaticamente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuditoriaPage,
});

type Filtro = "todos" | "schools" | "user_roles";

function AuditoriaPage() {
  const rbac = useRbac();
  const trail = useAuditTrail();
  const units = useOrgTree();
  const schools = useNetworkSchools();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  if (!rbac.isLoading && !rbac.can("org:manage")) {
    return (
      <MobileShell title="Trilha de auditoria">
        <div className="px-5 py-10 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Apenas superadministradores acompanham a trilha de auditoria.
          </p>
        </div>
      </MobileShell>
    );
  }

  const unitName = (id: string | null) =>
    id ? orgUnitPath(units.data ?? [], id) || "unidade removida" : "sem unidade";
  const schoolName = (id: string | null) =>
    (schools.data ?? []).find((s) => s.id === id)?.name ?? id ?? "—";

  const entries = (trail.data ?? []).filter((e) => filtro === "todos" || e.entity === filtro);

  return (
    <MobileShell title="Trilha de auditoria">
      <div className="px-5 pt-4 pb-8 space-y-3">
        <div className="flex gap-2">
          {(["todos", "schools", "user_roles"] as Filtro[]).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filtro === f ? "default" : "outline"}
              className="rounded-xl h-8 text-xs"
              onClick={() => setFiltro(f)}
            >
              {f === "todos" ? "Todos" : f === "schools" ? "Escolas" : "Papéis"}
            </Button>
          ))}
        </div>

        {trail.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {trail.isError && <ErrorRetry error={trail.error} onRetry={() => trail.refetch()} />}
        {!trail.isLoading && entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registrado.</p>
        )}

        {entries.map((e) => {
          const isSchool = e.entity === "schools";
          const meta = e.metadata as { school_name?: string; school_id?: string; org_unit_id?: string };
          return (
            <Card key={e.id} className="p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0">
                  {isSchool ? <Building2 className="size-4" /> : <UserCog className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">
                      {isSchool ? (meta.school_name ?? "Escola") : "Papel de usuário"}
                    </p>
                    <Badge variant="outline" className="text-[10px] uppercase">{e.action}</Badge>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {isSchool ? (
                      <>
                        Unidade: <strong>{unitName(e.old_value)}</strong> →{" "}
                        <strong>{unitName(e.new_value)}</strong>
                      </>
                    ) : (
                      <>
                        Papel: <strong>{e.old_value ?? "—"}</strong> → <strong>{e.new_value ?? "removido"}</strong>
                        {meta.school_id ? ` · ${schoolName(meta.school_id)}` : ""}
                        {meta.org_unit_id ? ` · ${unitName(meta.org_unit_id)}` : ""}
                      </>
                    )}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <History className="size-3" /> {new Date(e.created_at).toLocaleString("pt-BR")}
                    {e.actor_id ? ` · por ${e.actor_id.slice(0, 8)}` : " · sistema"}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </MobileShell>
  );
}
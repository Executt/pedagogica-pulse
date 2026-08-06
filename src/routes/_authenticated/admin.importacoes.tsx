import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, FileClock, ShieldAlert } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorRetry } from "@/components/query-state";
import { useImportRuns, useRbac } from "@/hooks/use-org";

export const Route = createFileRoute("/_authenticated/admin/importacoes")({
  head: () => ({
    meta: [
      { title: "Histórico de importações — Inteligência Pedagógica" },
      {
        name: "description",
        content: "Registro de cada importação de PDF: usuário, data, escolas criadas/atualizadas e inconsistências.",
      },
      { property: "og:title", content: "Histórico de importações — Inteligência Pedagógica" },
      { property: "og:description", content: "Auditoria das importações do cadastro oficial da rede." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportacoesPage,
});

function ImportacoesPage() {
  const rbac = useRbac();
  const runs = useImportRuns();

  if (!rbac.isLoading && !rbac.can("school:import")) {
    return (
      <MobileShell title="Histórico de importações">
        <div className="px-5 py-10 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Acesso restrito.</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell title="Histórico de importações">
      <div className="px-5 pt-4 pb-8 space-y-3">
        {runs.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {runs.isError && <ErrorRetry error={runs.error} onRetry={() => runs.refetch()} />}
        {runs.data?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma importação registrada ainda.</p>
        )}

        {(runs.data ?? []).map((r) => (
          <Card key={r.id} className="p-4 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <FileClock className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{r.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">{r.total_detected} detectadas</Badge>
                  <Badge className="text-[10px]">{r.inserted_count} novas</Badge>
                  <Badge variant="outline" className="text-[10px]">{r.updated_count} atualizadas</Badge>
                  <Badge variant="outline" className="text-[10px]">{r.units_count} unidades</Badge>
                  {r.skipped_count > 0 && (
                    <Badge variant="destructive" className="text-[10px]">{r.skipped_count} bloqueadas</Badge>
                  )}
                </div>
                {r.issues.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-[11px] text-muted-foreground cursor-pointer">
                      {r.issues.length} inconsistência(s) registradas
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      {r.issues.map((i, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-1 text-[11px] ${
                            i.severity === "erro" ? "text-destructive" : "text-amber-600"
                          }`}
                        >
                          <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                          <span>
                            <strong>{i.school}</strong> · {i.field}: {i.message}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </MobileShell>
  );
}
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  Download,
  FileClock,
  Loader2,
  Search,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ErrorRetry, LoadMore } from "@/components/query-state";
import { usePaginated } from "@/hooks/use-paginated";
import { useAuditRecorder, useImportRuns, useRbac } from "@/hooks/use-org";
import { importRunsCsvFileName, importRunsToCsv } from "@/domain/import/csv";
import {
  RUN_SORT_LABEL,
  searchImportRuns,
  searchIssues,
  sortImportRuns,
  type RunSortBy,
  type SortDir,
} from "@/domain/import/query";
import type { ImportRunRecord } from "@/application/ports/org-repository";
import { downloadTextFile } from "@/lib/download";

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
  const recordAudit = useAuditRecorder();
  const all = runs.data ?? [];

  const [term, setTerm] = useState("");
  const [sortBy, setSortBy] = useState<RunSortBy>("date");
  const [dir, setDir] = useState<SortDir>("desc");
  const [exportState, setExportState] = useState<{
    status: "idle" | "running" | "done" | "error";
    progress: number;
    message: string;
  }>({ status: "idle", progress: 0, message: "" });

  const rows = useMemo(
    () => sortImportRuns(searchImportRuns(all, term), sortBy, dir),
    [all, term, sortBy, dir],
  );
  const page = usePaginated(rows, 8);

  async function exportCsv() {
    if (rows.length === 0) {
      setExportState({ status: "error", progress: 0, message: "Nenhuma importação para exportar." });
      toast.error("Nenhuma importação para exportar.");
      return;
    }
    setExportState({ status: "running", progress: 15, message: "Preparando registros..." });
    try {
      await new Promise((r) => setTimeout(r, 60));
      const csv = importRunsToCsv(rows);
      setExportState({ status: "running", progress: 65, message: "Gerando arquivo CSV..." });
      const fileName = importRunsCsvFileName();
      downloadTextFile(csv, fileName);
      setExportState({ status: "running", progress: 90, message: "Registrando na auditoria..." });
      const issues = rows.reduce((sum, r) => sum + r.issues.length, 0);
      const logged = await recordAudit({
        entity: "import_runs",
        action: "export_csv",
        field: "csv",
        new_value: fileName,
        metadata: { runs: rows.length, issues, filtro: term || null, ordenacao: `${sortBy}:${dir}` },
      });
      setExportState({
        status: "done",
        progress: 100,
        message: `${rows.length} execução(ões) e ${issues} inconsistência(s) exportadas${logged ? " · registrado na auditoria" : ""}.`,
      });
      toast.success("CSV gerado com data, usuário, contagens e inconsistências.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao gerar o CSV.";
      setExportState({ status: "error", progress: 0, message: msg });
      toast.error(msg);
    }
  }

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
    <MobileShell
      title="Histórico de importações"
      action={
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg text-xs gap-1"
          onClick={() => void exportCsv()}
          disabled={rows.length === 0 || exportState.status === "running"}
        >
          {exportState.status === "running" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}{" "}
          CSV
        </Button>
      }
    >
      <div className="px-5 pt-4 pb-8 space-y-3">
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar por arquivo, escola, campo ou mensagem"
              className="h-10 pl-9 rounded-xl text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {(Object.keys(RUN_SORT_LABEL) as RunSortBy[]).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={sortBy === k ? "secondary" : "ghost"}
                className="h-7 px-2 text-[11px] rounded-lg"
                onClick={() => setSortBy(k)}
              >
                {RUN_SORT_LABEL[k]}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px] rounded-lg gap-1"
              onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
            >
              <ArrowDownUp className="size-3" /> {dir === "asc" ? "Crescente" : "Decrescente"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {rows.length} de {all.length} execução(ões)
          </p>
        </div>

        {exportState.status !== "idle" && (
          <Card
            className={`p-3 rounded-2xl ${
              exportState.status === "error" ? "border-destructive/30 bg-destructive/5" : ""
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              {exportState.status === "running" && <Loader2 className="size-3.5 animate-spin" />}
              {exportState.status === "done" && (
                <CheckCircle2 className="size-3.5 text-emerald-600" />
              )}
              {exportState.status === "error" && (
                <AlertTriangle className="size-3.5 text-destructive" />
              )}
              <span className={exportState.status === "error" ? "text-destructive" : ""}>
                {exportState.message}
              </span>
            </div>
            {exportState.status !== "error" && (
              <Progress value={exportState.progress} className="mt-2 h-1.5" />
            )}
          </Card>
        )}

        {runs.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {runs.isError && <ErrorRetry error={runs.error} onRetry={() => runs.refetch()} />}
        {!runs.isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            {all.length === 0
              ? "Nenhuma importação registrada ainda."
              : "Nenhum resultado para a busca."}
          </p>
        )}

        {page.visible.map((r) => (
          <RunCard key={r.id} run={r} term={term} />
        ))}
        <LoadMore hasMore={page.hasMore} onMore={page.loadMore} />
      </div>
    </MobileShell>
  );
}

function RunCard({ run, term }: { run: ImportRunRecord; term: string }) {
  const filtered = useMemo(() => searchIssues(run.issues, term), [run.issues, term]);
  const issuePage = usePaginated(filtered, 5);

  return (
    <Card className="p-4 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <FileClock className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{run.file_name}</p>
          <p className="text-[11px] text-muted-foreground">
            {new Date(run.created_at).toLocaleString("pt-BR")}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-[10px]">{run.total_detected} detectadas</Badge>
            <Badge className="text-[10px]">{run.inserted_count} novas</Badge>
            <Badge variant="outline" className="text-[10px]">{run.updated_count} atualizadas</Badge>
            <Badge variant="outline" className="text-[10px]">{run.units_count} unidades</Badge>
            {run.skipped_count > 0 && (
              <Badge variant="destructive" className="text-[10px]">{run.skipped_count} bloqueadas</Badge>
            )}
          </div>
          {run.issues.length > 0 && (
            <details className="mt-2" open={term.length > 0 && filtered.length > 0}>
              <summary className="text-[11px] text-muted-foreground cursor-pointer">
                {filtered.length} de {run.issues.length} inconsistência(s)
              </summary>
              <ul className="mt-1 space-y-0.5">
                {issuePage.visible.map((i, idx) => (
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
              {issuePage.hasMore && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-1 h-7 px-2 text-[11px] rounded-lg"
                  onClick={issuePage.loadMore}
                >
                  Ver mais inconsistências
                </Button>
              )}
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}
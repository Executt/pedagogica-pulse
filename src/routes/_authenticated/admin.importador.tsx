import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownUp,
  CheckCircle2,
  FileUp,
  Loader2,
  Search,
  ShieldAlert,
  Undo2,
  XCircle,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { LoadMore } from "@/components/query-state";
import { usePaginated } from "@/hooks/use-paginated";
import { extractPdfText } from "@/lib/pdf-text";
import {
  candidateStats,
  isImportable,
  parseSchoolsFromText,
  revalidateCandidates,
  type ParseResult,
  type SchoolCandidate,
} from "@/domain/import/school-pdf";
import { Input } from "@/components/ui/input";
import { importSchoolCandidates } from "@/application/use-cases/org";
import { orgRepository, useAuditRecorder, useNetworkSchools, useRbac } from "@/hooks/use-org";
import { ORG_UNIT_LABEL } from "@/domain/org/types";
import {
  applyFieldDecisions,
  changedRows,
  diffCandidate,
  groupByUnit,
  groupIssuesByType,
  matchExistingSchool,
} from "@/domain/import/review";
import {
  CANDIDATE_SORT_LABEL,
  searchCandidates,
  sortCandidates,
  type CandidateSortBy,
  type SortDir,
} from "@/domain/import/query";
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
  type Draft,
} from "@/domain/import/draft";

export const Route = createFileRoute("/_authenticated/admin/importador")({
  head: () => ({
    meta: [
      { title: "Importador de escolas — Inteligência Pedagógica" },
      {
        name: "description",
        content:
          "Importe o PDF oficial da rede municipal, revise inconsistências e popule escolas, regionais e distritos.",
      },
      { property: "og:title", content: "Importador de escolas — Inteligência Pedagógica" },
      {
        property: "og:description",
        content: "Extração, normalização e revisão manual das escolas da rede municipal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportadorPage,
});

function ImportadorPage() {
  const rbac = useRbac();
  const qc = useQueryClient();
  const existingSchools = useNetworkSchools();
  const recordAudit = useAuditRecorder();
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState<Draft>(() => createDraft());
  const [editing, setEditing] = useState<string | null>(null);
  const [comparing, setComparing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [term, setTerm] = useState("");
  const [sortBy, setSortBy] = useState<CandidateSortBy>("name");
  const [dir, setDir] = useState<SortDir>("asc");
  const [progress, setProgress] = useState<{
    status: "idle" | "running" | "done" | "error";
    value: number;
    message: string;
  }>({ status: "idle", value: 0, message: "" });

  /** Toda alteração do rascunho entra no histórico e pode ser desfeita. */
  const mutateDraft = (label: string, fn: Parameters<typeof applyDraft>[2]) =>
    setDraft((d) => applyDraft(d, label, fn));

  const toggle = (key: string, name: string) =>
    mutateDraft(
      `${isSelected(draft.state, key) ? "Rejeitada" : "Aceita"} · ${name}`,
      (s) => toggleSelection(s, key),
    );

  async function handleFile(file: File) {
    setParsing(true);
    try {
      const text = await extractPdfText(file);
      const parsed = parseSchoolsFromText(text);
      setResult(parsed);
      setFileName(file.name);
      setConfirming(false);
      setProgress({ status: "idle", value: 0, message: "" });
      setDraft(createDraft(parsed.candidates.filter(isImportable).map((c) => c.key)));
      toast.success(`${parsed.candidates.length} escolas identificadas no PDF.`);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível ler o PDF. Verifique se o arquivo tem texto (não é digitalizado).");
    } finally {
      setParsing(false);
    }
  }

  /** Aplica a correção manual e revalida a lista inteira (duplicidades incluídas). */
  function patchCandidate(key: string, patch: Partial<SchoolCandidate>) {
    setResult((prev) => {
      if (!prev) return prev;
      const next = revalidateCandidates(
        prev.candidates.map((c) => (c.key === key ? { ...c, ...patch } : c)),
      );
      const stats = candidateStats(next.candidates);
      return {
        ...prev,
        candidates: next.candidates,
        stats: {
          ...prev.stats,
          withErrors: stats.withErrors,
          withWarnings: stats.withWarnings,
          duplicates: next.duplicates,
        },
      };
    });
  }

  const importMutation = useMutation({
    mutationFn: async (candidates: SchoolCandidate[]) => {
      setProgress({ status: "running", value: 20, message: "Enviando escolas selecionadas..." });
      const r = await importSchoolCandidates(orgRepository, candidates, {
        fileName,
        allCandidates: result?.candidates ?? candidates,
      });
      setProgress({ status: "running", value: 80, message: "Registrando decisões na auditoria..." });
      await recordAudit({
        entity: "import_runs",
        action: "review_confirm",
        field: "importacao",
        new_value: fileName,
        metadata: {
          selecionadas: candidates.length,
          criadas: r.inserted,
          atualizadas: r.updated,
          unidades: r.units,
          bloqueadas: r.skipped,
          campos_rejeitados: rejectedCount(draft.state),
          decisoes: draft.history.map((h) => h.label),
        },
      });
      return r;
    },
    onSuccess: (r) => {
      setProgress({
        status: "done",
        value: 100,
        message: `${r.inserted} criadas, ${r.updated} atualizadas · registrado na auditoria.`,
      });
      toast.success(
        `Importação concluída: ${r.inserted} novas, ${r.updated} atualizadas, ${r.units} unidades, ${r.skipped} bloqueadas.`,
      );
      setConfirming(false);
      qc.invalidateQueries({ queryKey: ["org-schools"] });
      qc.invalidateQueries({ queryKey: ["org-tree"] });
      qc.invalidateQueries({ queryKey: ["import-runs"] });
      qc.invalidateQueries({ queryKey: ["audit-trail"] });
    },
    onError: (e: Error) => {
      setProgress({ status: "error", value: 0, message: e.message });
      toast.error(e.message);
    },
  });

  const allCandidates = result?.candidates ?? [];
  const filtered = useMemo(
    () => sortCandidates(searchCandidates(allCandidates, term), sortBy, dir),
    [allCandidates, term, sortBy, dir],
  );
  const page = usePaginated(filtered, 10);

  if (!rbac.isLoading && !rbac.can("school:import")) {
    return (
      <MobileShell title="Importador de escolas">
        <div className="px-5 py-10 text-center">
          <ShieldAlert className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Apenas superadministrador ou secretário podem importar o cadastro oficial da rede.
          </p>
        </div>
      </MobileShell>
    );
  }

  const candidates = allCandidates;
  const schools = existingSchools.data ?? [];
  const chosen = candidates
    .filter((c) => isSelected(draft.state, c.key) && isImportable(c))
    .map((c) =>
      applyFieldDecisions(c, matchExistingSchool(c, schools), draft.state.rejectedFields[c.key] ?? []),
    );
  const blockedSelected = candidates.filter(
    (c) => isSelected(draft.state, c.key) && !isImportable(c),
  );
  const warningsInChosen = chosen.filter((c) => c.issues.length > 0);
  const issueGroups = groupIssuesByType(candidates);
  const unitGroups = groupByUnit(candidates);

  /** Ação em lote (rascunho): aceita ou rejeita um conjunto de chaves, com desfazer. */
  function applyBulk(label: string, keys: string[], accept: boolean) {
    const importable = keys.filter((k) => {
      const c = candidates.find((x) => x.key === k);
      return c ? isImportable(c) : false;
    });
    const n = accept ? importable.length : keys.length;
    mutateDraft(`${accept ? "Aceitas" : "Rejeitadas"} ${n} · ${label}`, (s) =>
      bulkSelect(s, accept ? importable : keys, accept),
    );
  }

  return (
    <MobileShell title="Importador de escolas">
      <div className="px-5 pt-4 pb-8 space-y-4">
        <Card className="p-4 rounded-2xl">
          <h2 className="text-sm font-semibold">1. PDF oficial da rede</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            O arquivo é lido no seu dispositivo. Nada é enviado antes da sua revisão.
          </p>
          <label className="mt-3 flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed cursor-pointer text-sm">
            {parsing ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            {parsing ? "Lendo PDF..." : "Selecionar PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
          </label>
        </Card>

        {result && (
          <>
            <Card className="p-4 rounded-2xl">
              <h2 className="text-sm font-semibold">2. Diagnóstico da extração</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <Stat label="Escolas" value={candidates.length} />
                <Stat label="Unidades detectadas" value={result.orgUnits.length} />
                <Stat label="Com erro (bloqueadas)" value={result.stats.withErrors} />
                <Stat label="Com aviso" value={result.stats.withWarnings} />
              </div>
              {result.orgUnits.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {result.orgUnits.map((u) => (
                    <Badge key={u.name} variant="secondary" className="text-[10px]">
                      {ORG_UNIT_LABEL[u.type]}: {u.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">3. Revisão manual</h2>
                <span className="text-[11px] text-muted-foreground">
                  {chosen.length} de {candidates.length} selecionadas
                </span>
              </div>

              <Card className="p-3 rounded-2xl space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Buscar por nome, INEP, CNPJ, unidade ou inconsistência"
                    className="h-10 pl-9 rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  {(Object.keys(CANDIDATE_SORT_LABEL) as CandidateSortBy[]).map((k) => (
                    <Button
                      key={k}
                      size="sm"
                      variant={sortBy === k ? "secondary" : "ghost"}
                      className="h-7 px-2 text-[11px] rounded-lg"
                      onClick={() => setSortBy(k)}
                    >
                      {CANDIDATE_SORT_LABEL[k]}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px] rounded-lg gap-1"
                    onClick={() => setDir((d) => (d === "asc" ? "desc" : "asc"))}
                  >
                    <ArrowDownUp className="size-3" /> {dir === "asc" ? "A–Z" : "Z–A"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {filtered.length} de {candidates.length} escolas · {rejectedCount(draft.state)} campo(s)
                  rejeitado(s)
                </p>
              </Card>

              <Card className="p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold">Ações em lote (rascunho)</h3>
                  {canUndo(draft) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px] rounded-lg gap-1"
                      onClick={() => {
                        setDraft((d) => undoDraft(d));
                        toast.success("Última decisão desfeita.");
                      }}
                    >
                      <Undo2 className="size-3" /> Desfazer
                    </Button>
                  )}
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Por tipo de inconsistência</p>
                  <div className="mt-1 space-y-1">
                    {issueGroups.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">Nenhuma inconsistência detectada.</p>
                    )}
                    {issueGroups.map((g) => (
                      <BulkRow
                        key={`${g.field}-${g.severity}`}
                        label={`${g.field} · ${g.severity}`}
                        count={g.count}
                        onAccept={() => applyBulk(`${g.field} (${g.severity})`, g.keys, true)}
                        onReject={() => applyBulk(`${g.field} (${g.severity})`, g.keys, false)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-muted-foreground">Por hierarquia</p>
                  <div className="mt-1 space-y-1">
                    {unitGroups.map((g) => (
                      <BulkRow
                        key={g.unit}
                        label={g.unit}
                        count={g.count}
                        onAccept={() => applyBulk(g.unit, g.keys, true)}
                        onReject={() => applyBulk(g.unit, g.keys, false)}
                      />
                    ))}
                  </div>
                </div>

                {draft.history.length > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      Histórico de alterações ({draft.history.length})
                    </p>
                    <ul className="mt-1 rounded-xl bg-secondary/50 px-3 py-2 space-y-0.5">
                      {draft.history.slice(0, 8).map((h, i) => (
                        <li key={`${h.at}-${i}`} className="text-[11px] text-muted-foreground">
                          {new Date(h.at).toLocaleTimeString("pt-BR")} · {h.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              {candidates.map((c) => {
                const blocked = !isImportable(c);
                const isEditing = editing === c.key;
                const existing = matchExistingSchool(c, schools);
                const diff = diffCandidate(c, existing);
                const changes = changedRows(diff);
                return (
                  <Card key={c.key} className="p-3 rounded-2xl">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.has(c.key)}
                        disabled={blocked}
                        onCheckedChange={() => toggle(c.key)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{c.name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          INEP {c.inep_code ?? "—"} · CNPJ {c.cnpj ?? "—"} ·{" "}
                          {c.orgUnitName ?? "sem unidade"}
                        </p>
                        {c.address && (
                          <p className="text-[11px] text-muted-foreground truncate">{c.address}</p>
                        )}
                        {c.issues.length === 0 ? (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600">
                            <CheckCircle2 className="size-3" /> Sem inconsistências
                          </p>
                        ) : (
                          <ul className="mt-1 space-y-0.5">
                            {c.issues.map((i, idx) => (
                              <li
                                key={idx}
                                className={`flex items-start gap-1 text-[11px] ${
                                  i.severity === "erro" ? "text-destructive" : "text-amber-600"
                                }`}
                              >
                                <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                                <span>
                                  <strong>{i.field}</strong>: {i.message}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 h-7 px-2 text-[11px] rounded-lg"
                          onClick={() => setEditing(isEditing ? null : c.key)}
                        >
                          {isEditing ? "Fechar correção" : "Corrigir manualmente"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 h-7 px-2 text-[11px] rounded-lg"
                          onClick={() => setComparing(comparing === c.key ? null : c.key)}
                        >
                          {comparing === c.key
                            ? "Fechar comparação"
                            : existing
                              ? `Comparar com a base (${changes.length} mudança${changes.length === 1 ? "" : "s"})`
                              : "Comparar com a base (nova escola)"}
                        </Button>

                        {comparing === c.key && (
                          <div className="mt-2 rounded-xl border overflow-hidden">
                            <div className="grid grid-cols-[70px_1fr_1fr] bg-secondary/60 px-2 py-1 text-[10px] font-medium">
                              <span>Campo</span>
                              <span>Extraído do PDF</span>
                              <span>{existing ? "Valor atual" : "Não existe na base"}</span>
                            </div>
                            {diff.map((row) => (
                              <div
                                key={row.field}
                                className={`grid grid-cols-[70px_1fr_1fr] px-2 py-1 text-[10px] border-t ${
                                  row.changed ? "bg-amber-500/5" : ""
                                }`}
                              >
                                <span className="text-muted-foreground">{row.label}</span>
                                <span className={row.changed ? "font-medium" : ""}>{row.extracted}</span>
                                <span className="text-muted-foreground">{row.current}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isEditing && (
                          <div className="mt-2 space-y-2">
                            <FieldRow label="Nome">
                              <Input
                                value={c.name}
                                onChange={(e) => patchCandidate(c.key, { name: e.target.value })}
                                className="h-9 text-xs rounded-lg"
                              />
                            </FieldRow>
                            <FieldRow label="INEP">
                              <Input
                                value={c.inep_code ?? ""}
                                inputMode="numeric"
                                onChange={(e) =>
                                  patchCandidate(c.key, {
                                    inep_code: e.target.value.replace(/\D/g, "") || null,
                                  })
                                }
                                className="h-9 text-xs rounded-lg"
                              />
                            </FieldRow>
                            <FieldRow label="CNPJ">
                              <Input
                                value={c.cnpj ?? ""}
                                inputMode="numeric"
                                onChange={(e) =>
                                  patchCandidate(c.key, {
                                    cnpj: e.target.value.replace(/\D/g, "") || null,
                                  })
                                }
                                className="h-9 text-xs rounded-lg"
                              />
                            </FieldRow>
                            <FieldRow label="Unidade">
                              <Input
                                value={c.orgUnitName ?? ""}
                                placeholder="Ex.: REGIONAL NORTE"
                                onChange={(e) =>
                                  patchCandidate(c.key, {
                                    orgUnitName: e.target.value || null,
                                    orgUnitType: c.orgUnitType ?? "regional",
                                  })
                                }
                                className="h-9 text-xs rounded-lg"
                              />
                            </FieldRow>
                            <FieldRow label="Endereço">
                              <Input
                                value={c.address ?? ""}
                                onChange={(e) => patchCandidate(c.key, { address: e.target.value || null })}
                                className="h-9 text-xs rounded-lg"
                              />
                            </FieldRow>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {!confirming ? (
              <Button
                className="w-full h-11 rounded-xl"
                disabled={chosen.length === 0}
                onClick={() => setConfirming(true)}
              >
                Revisar e concluir ({chosen.length})
              </Button>
            ) : (
              <Card className="p-4 rounded-2xl space-y-3">
                <h2 className="text-sm font-semibold">4. Confirmação final</h2>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    <strong className="text-foreground">{chosen.length}</strong> escola(s) serão criadas ou
                    atualizadas.
                  </li>
                  <li>
                    <strong className="text-foreground">{warningsInChosen.length}</strong> com avisos aceitos
                    manualmente.
                  </li>
                  {bulkLog.length > 0 && (
                    <li>
                      <strong className="text-foreground">{bulkLog.length}</strong> ação(ões) em lote aplicadas:{" "}
                      {bulkLog.join("; ")}.
                    </li>
                  )}
                  <li>
                    <strong className="text-foreground">
                      {candidates.filter((c) => !isImportable(c)).length}
                    </strong>{" "}
                    bloqueada(s) por erro — não serão enviadas
                    {blockedSelected.length > 0 ? " (mesmo marcadas)." : "."}
                  </li>
                  <li>O histórico desta importação ficará registrado com seu usuário e a data.</li>
                </ul>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => setConfirming(false)}
                    disabled={importMutation.isPending}
                  >
                    Voltar à revisão
                  </Button>
                  <Button
                    className="flex-1 h-11 rounded-xl"
                    disabled={chosen.length === 0 || importMutation.isPending}
                    onClick={() => importMutation.mutate(chosen)}
                  >
                    {importMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                    Confirmar importação
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[70px_1fr] items-center gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function BulkRow({
  label,
  count,
  onAccept,
  onReject,
}: {
  label: string;
  count: number;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/40 px-2 py-1">
      <span className="min-w-0 flex-1 truncate text-[11px]">
        {label} <span className="text-muted-foreground">({count})</span>
      </span>
      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded-md" onClick={onAccept}>
        Aceitar
      </Button>
      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] rounded-md" onClick={onReject}>
        Rejeitar
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/50 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
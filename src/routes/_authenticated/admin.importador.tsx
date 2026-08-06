import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, ShieldAlert } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { orgRepository, useRbac } from "@/hooks/use-org";
import { ORG_UNIT_LABEL } from "@/domain/org/types";

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
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  async function handleFile(file: File) {
    setParsing(true);
    try {
      const text = await extractPdfText(file);
      const parsed = parseSchoolsFromText(text);
      setResult(parsed);
      setFileName(file.name);
      setConfirming(false);
      setSelected(new Set(parsed.candidates.filter(isImportable).map((c) => c.key)));
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
    mutationFn: async (candidates: SchoolCandidate[]) =>
      importSchoolCandidates(orgRepository, candidates, {
        fileName,
        allCandidates: result?.candidates ?? candidates,
      }),
    onSuccess: (r) => {
      toast.success(
        `Importação concluída: ${r.inserted} novas, ${r.updated} atualizadas, ${r.units} unidades, ${r.skipped} bloqueadas.`,
      );
      setConfirming(false);
      qc.invalidateQueries({ queryKey: ["org-schools"] });
      qc.invalidateQueries({ queryKey: ["org-tree"] });
      qc.invalidateQueries({ queryKey: ["import-runs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const candidates = result?.candidates ?? [];
  const chosen = candidates.filter((c) => selected.has(c.key) && isImportable(c));
  const blockedSelected = candidates.filter((c) => selected.has(c.key) && !isImportable(c));
  const warningsInChosen = chosen.filter((c) => c.issues.length > 0);

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
              {candidates.map((c) => {
                const blocked = !isImportable(c);
                const isEditing = editing === c.key;
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-secondary/50 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
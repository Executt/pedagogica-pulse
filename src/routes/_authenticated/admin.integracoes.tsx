import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { Plug, RefreshCw, CheckCircle2, XCircle, Trash2, Plus, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  listConnectors,
  saveConnector,
  deleteConnector,
  testConnector,
  type ConnectorView,
} from "@/lib/integration-hub.functions";

export const Route = createFileRoute("/_authenticated/admin/integracoes")({
  component: IntegracoesPage,
  head: () => ({
    meta: [
      { title: "Integrações — Inteligência Pedagógica" },
      { name: "description", content: "Cadastro e teste das integrações com sistemas externos da rede de educação." },
      { property: "og:title", content: "Integrações — Inteligência Pedagógica" },
      { property: "og:description", content: "Cadastro e teste das integrações com sistemas externos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const TIPOS = [
  { value: "pulse", label: "Inteligência Pedagógica (assinado)" },
  { value: "rest", label: "REST / HTTP" },
  { value: "soap", label: "SOAP (SEI)" },
  { value: "sftp", label: "SFTP (arquivos)" },
];

function IntegracoesPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["connectors"], queryFn: () => listConnectors() });
  const [novo, setNovo] = React.useState(false);

  return (
    <MobileShell title="Integrações">
      <div className="px-5 pt-6 space-y-4 pb-10">
        <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
          <div className="flex items-center gap-2">
            <Plug className="size-4 text-primary" />
            <p className="text-sm font-semibold">Central de integrações</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Cada sistema externo é cadastrado aqui com endereço, credencial e teste de conexão. As credenciais ficam
            guardadas no servidor e nunca aparecem por completo.
          </p>
        </Card>

        {list.isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {list.data?.error && <p className="text-sm text-destructive">{list.data.error}</p>}

        {(list.data?.connectors ?? []).map((c) => (
          <ConnectorCard key={c.id} c={c} onChanged={() => qc.invalidateQueries({ queryKey: ["connectors"] })} />
        ))}

        {novo ? (
          <ConnectorForm
            onDone={() => {
              setNovo(false);
              qc.invalidateQueries({ queryKey: ["connectors"] });
            }}
          />
        ) : (
          <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => setNovo(true)}>
            <Plus className="size-4 mr-1.5" /> Nova integração
          </Button>
        )}
      </div>
    </MobileShell>
  );
}

function ConnectorCard({ c, onChanged }: { c: ConnectorView; onChanged: () => void }) {
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; detail: string; status: number } | null>(null);

  const test = useMutation({
    mutationFn: () => testConnector({ data: { id: c.id } }),
    onSuccess: (r: any) => {
      setResult(r);
      r.ok ? toast.success(r.detail) : toast.error(r.detail);
      onChanged();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha no teste"),
  });

  const del = useMutation({
    mutationFn: () => deleteConnector({ data: { id: c.id } }),
    onSuccess: () => {
      toast.success("Integração removida");
      onChanged();
    },
  });

  const toggle = useMutation({
    mutationFn: (ativo: boolean) =>
      saveConnector({ data: { slug: c.slug, nome: c.nome, tipo: c.tipo, baseUrl: c.base_url ?? "", ativo } }),
    onSuccess: onChanged,
  });

  const okLast = c.ultimo_status !== null && c.ultimo_status >= 200 && c.ultimo_status < 400;

  return (
    <Card className="p-4 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <Plug className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold truncate">{c.nome}</p>
            <Switch checked={c.ativo} onCheckedChange={(v) => toggle.mutate(v)} />
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{c.base_url || "sem endereço"}</p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="uppercase font-semibold px-2 py-0.5 rounded-full bg-secondary">{c.tipo}</span>
            {c.secretMasked && (
              <span className="font-mono px-2 py-0.5 rounded-full bg-secondary">{c.secretMasked}</span>
            )}
            {c.ultimo_teste_em && (
              <span className={`px-2 py-0.5 rounded-full ${okLast ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {okLast ? "OK" : "Falha"} · {new Date(c.ultimo_teste_em).toLocaleString("pt-BR")}
              </span>
            )}
          </div>

          {(result || c.ultimo_erro) && (
            <p className="mt-2 text-[11px] text-muted-foreground flex items-start gap-1.5">
              {result?.ok ? (
                <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-px" />
              ) : (
                <AlertTriangle className="size-3.5 text-accent shrink-0 mt-px" />
              )}
              {result?.detail ?? c.ultimo_erro}
            </p>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl" disabled={test.isPending} onClick={() => test.mutate()}>
              {test.isPending ? <RefreshCw className="size-3.5 mr-1.5 animate-spin" /> : <CheckCircle2 className="size-3.5 mr-1.5" />}
              Testar
            </Button>
            <Button variant="outline" size="sm" className="h-9 rounded-xl" onClick={() => setOpen((v) => !v)}>
              <Save className="size-3.5 mr-1.5" /> {open ? "Fechar" : "Configurar"}
            </Button>
          </div>

          {open && (
            <div className="mt-2">
              <ConnectorForm initial={c} onDone={() => { setOpen(false); onChanged(); }} />
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 w-full rounded-lg text-xs text-destructive"
                onClick={() => del.mutate()}
              >
                <Trash2 className="size-3.5 mr-1.5" /> Remover integração
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ConnectorForm({ initial, onDone }: { initial?: ConnectorView; onDone: () => void }) {
  const [slug, setSlug] = React.useState(initial?.slug ?? "");
  const [nome, setNome] = React.useState(initial?.nome ?? "");
  const [tipo, setTipo] = React.useState(initial?.tipo ?? "rest");
  const [baseUrl, setBaseUrl] = React.useState(initial?.base_url ?? "");
  const [secret, setSecret] = React.useState("");
  const [configText, setConfigText] = React.useState(JSON.stringify(initial?.config ?? {}, null, 2));

  const save = useMutation({
    mutationFn: () => {
      let config: Record<string, unknown> | undefined;
      try {
        config = configText.trim() ? JSON.parse(configText) : {};
      } catch {
        throw new Error("Configuração não é um JSON válido.");
      }
      return saveConnector({
        data: {
          slug: slug.trim(),
          nome: nome.trim(),
          tipo: tipo as any,
          baseUrl: baseUrl.trim(),
          config,
          ...(secret.trim() ? { secret: secret.trim() } : {}),
        },
      });
    },
    onSuccess: (r: any) => {
      if (!r.ok) return toast.error(r.error ?? "Falha ao salvar");
      toast.success("Integração salva");
      setSecret("");
      onDone();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  return (
    <div className="space-y-2 rounded-xl bg-secondary/40 p-3">
      <Input placeholder="Identificador (ex.: sei)" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={Boolean(initial)} className="h-10 rounded-xl text-xs" />
      <Input placeholder="Nome exibido" value={nome} onChange={(e) => setNome(e.target.value)} className="h-10 rounded-xl text-xs" />
      <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
        <SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          {TIPOS.map((t) => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Endereço (https://…)" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="h-10 rounded-xl text-xs" />
      <Input type="password" autoComplete="off" placeholder={initial?.secretMasked ? `Credencial atual: ${initial.secretMasked}` : "Credencial / token"} value={secret} onChange={(e) => setSecret(e.target.value)} className="h-10 rounded-xl font-mono text-xs" />
      <textarea
        value={configText}
        onChange={(e) => setConfigText(e.target.value)}
        rows={4}
        spellCheck={false}
        className="w-full rounded-xl border border-input bg-background p-2 font-mono text-[11px]"
      />
      <Button className="w-full h-10 rounded-xl" disabled={save.isPending || !slug.trim() || !nome.trim()} onClick={() => save.mutate()}>
        <Save className="size-3.5 mr-1.5" /> {save.isPending ? "Salvando…" : "Salvar"}
      </Button>
      {tipo === "sftp" && (
        <p className="text-[10px] text-muted-foreground flex items-start gap-1">
          <XCircle className="size-3 shrink-0 mt-px" />
          O envio por SFTP precisa de um serviço-ponte; aqui ficam registrados endereço, usuário e pasta.
        </p>
      )}
    </div>
  );
}

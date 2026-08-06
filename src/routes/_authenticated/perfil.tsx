import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { LogOut, Megaphone, ChevronRight, School, GraduationCap, Database, RefreshCw, Download, Upload, Plug, CheckCircle2, XCircle, AlertTriangle, KeyRound, Bug, Save, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useMyProfile, useMyRoles } from "@/hooks/use-current-user";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMockMode, setMockMode, resetMockData, exportMockData, importMockData } from "@/lib/mock-mode";
import { resetHealth } from "@/lib/api-health";
import { checkPulseConnection } from "@/lib/pulse-read.functions";
import { amISuperadmin, getPulseSettings, savePulseSettings, getPulseLogs } from "@/lib/pulse-admin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { clearPersistedQueries } from "@/lib/query-persist";
import { useRbac } from "@/hooks/use-org";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: Perfil,
});

function Perfil() {
  const user = useCurrentUser();
  const profile = useMyProfile();
  const roles = useMyRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const mock = useMockMode();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <MobileShell title="Perfil">
      <div className="px-5 pt-6 space-y-4">
        <Card className="p-5 rounded-2xl flex items-center gap-4">
          <div className="size-14 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground grid place-items-center text-lg font-bold">
            {profile.data?.full_name?.split(" ").map((p) => p[0]).slice(0, 2).join("") || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{profile.data?.full_name || "—"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </Card>

        <RoleAssignment hasRoles={(roles.data?.length ?? 0) > 0} />

        <PulseConnectionCard />

        {roles.data && roles.data.length > 0 && (
          <Card className="p-4 rounded-2xl">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Escolas & papéis</p>
            <div className="space-y-2">
              {roles.data.map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <School className="size-3.5 text-primary" />
                  <span className="flex-1 truncate">{r.schools?.name}</span>
                  <span className="text-[10px] uppercase font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{r.role}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="p-4 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0">
              <Database className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Modo demo</p>
                  <p className="text-[11px] text-muted-foreground">Usa dados de exemplo — sem chamar a API.</p>
                </div>
                <Switch checked={mock} onCheckedChange={(v) => {
                  setMockMode(v);
                  qc.invalidateQueries();
                  toast.success(v ? "Modo demo ativado" : "Modo demo desativado");
                }} />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-9 rounded-xl w-full"
                onClick={() => {
                  resetMockData();
                  qc.invalidateQueries();
                  toast.success("Dados de demonstração recriados");
                }}
              >
                <RefreshCw className="size-3.5 mr-1.5" /> Reiniciar dados mock
              </Button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-xl"
                  onClick={() => {
                    try {
                      const json = exportMockData();
                      const blob = new Blob([json], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `ip-mock-${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success("Cenário exportado");
                    } catch (e: any) {
                      toast.error(e?.message ?? "Falha ao exportar");
                    }
                  }}
                >
                  <Download className="size-3.5 mr-1.5" /> Exportar
                </Button>
                <label className="contents">
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        importMockData(text);
                        qc.invalidateQueries();
                        toast.success("Cenário importado");
                      } catch (err: any) {
                        toast.error(err?.message ?? "JSON inválido");
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                  <Button asChild variant="outline" size="sm" className="h-9 rounded-xl">
                    <span><Upload className="size-3.5 mr-1.5" /> Importar</span>
                  </Button>
                </label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 rounded-lg w-full text-xs text-muted-foreground"
                onClick={() => {
                  resetHealth();
                  qc.invalidateQueries();
                  toast.success("Status da API reiniciado");
                }}
              >
                Reiniciar status da API
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl overflow-hidden divide-y divide-border/60">
          <Link to="/comunicados" className="flex items-center gap-3 p-4 active:bg-secondary/50">
            <Megaphone className="size-4 text-primary" />
            <span className="flex-1 text-sm font-medium">Mural de comunicados</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <AdminImportLink />
        </Card>

        <Button onClick={signOut} variant="ghost" className="w-full h-11 rounded-xl text-destructive hover:text-destructive">
          <LogOut className="size-4 mr-2" /> Sair
        </Button>
      </div>
    </MobileShell>
  );
}

function RoleAssignment({ hasRoles }: { hasRoles: boolean }) {
  const user = useCurrentUser();
  const qc = useQueryClient();
  const schools = useQuery({
    queryKey: ["all-schools"],
    queryFn: async () => {
      // fetch all schools bypass RLS? no — we use service via unrestricted select
      // With current RLS, users only see schools they have role in.
      // For onboarding we need a public list. We use an RPC or just query directly:
      // Since RLS blocks unattached schools, use a small workaround: read via a special view? No — simplify:
      // Use a direct query; if empty, the user can't self-attach. But our RLS on schools requires has_school_access.
      // For the demo, we allow reading all schools by any authenticated user via a helper query.
      const { data, error } = await supabase.rpc("list_all_schools" as any);
      if (error) return [];
      return data ?? [];
    },
  });

  const m = useMutation({
    mutationFn: async ({ schoolId, role }: { schoolId: string; role: string }) => {
      if (!user) throw new Error("Sem usuário");
      const { error } = await supabase.from("user_roles").insert({
        user_id: user.id, school_id: schoolId, role: role as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Papel vinculado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [school, setSchool] = React.useState<string>("");
  const [role, setRole] = React.useState<string>("");

  if (hasRoles) return null;

  return (
    <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap className="size-4 text-primary" />
        <p className="font-semibold text-sm">Vincule-se a uma escola</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Escolha uma escola e seu papel para acessar dados.</p>
      <div className="space-y-2">
        <Select value={school} onValueChange={setSchool}>
          <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Selecione a escola" /></SelectTrigger>
          <SelectContent>
            {(schools.data ?? []).map((s: any) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Seu papel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="professor">Professor(a)</SelectItem>
            <SelectItem value="pedagogo">Pedagogo(a)</SelectItem>
            <SelectItem value="diretor">Diretor(a)</SelectItem>
          </SelectContent>
        </Select>
        <Button
          disabled={!school || !role || m.isPending}
          onClick={() => m.mutate({ schoolId: school, role })}
          className="w-full h-11 rounded-xl"
        >
          {m.isPending ? "Vinculando..." : "Vincular"}
        </Button>
      </div>
    </Card>
  );
}

function StatusPill({ tone, label }: { tone: "ok" | "warn" | "off"; label: string }) {
  const cls =
    tone === "ok"
      ? "bg-primary/10 text-primary"
      : tone === "warn"
        ? "bg-accent/15 text-accent"
        : "bg-destructive/10 text-destructive";
  return <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function PulseConnectionCard() {
  return <PulseConnectionCardInner />;
}

function AdminImportLink() {
  const rbac = useRbac();
  if (!rbac.can("school:import")) return null;
  return (
    <>
      <Link to="/admin/importador" className="flex items-center gap-3 p-4 active:bg-secondary/50">
        <Building2 className="size-4 text-primary" />
        <span className="flex-1 text-sm font-medium">Importador de escolas (PDF)</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
      <Link to="/admin/importacoes" className="flex items-center gap-3 p-4 active:bg-secondary/50">
        <Building2 className="size-4 text-primary" />
        <span className="flex-1 text-sm font-medium">Histórico de importações</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
      <Link to="/escolas" className="flex items-center gap-3 p-4 active:bg-secondary/50">
        <School className="size-4 text-primary" />
        <span className="flex-1 text-sm font-medium">Escolas da rede</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
      <Link to="/alunos" className="flex items-center gap-3 p-4 active:bg-secondary/50">
        <GraduationCap className="size-4 text-primary" />
        <span className="flex-1 text-sm font-medium">Alunos da rede</span>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
      {rbac.can("org:manage") && (
        <Link to="/admin/auditoria" className="flex items-center gap-3 p-4 active:bg-secondary/50">
          <Building2 className="size-4 text-primary" />
          <span className="flex-1 text-sm font-medium">Trilha de auditoria</span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      )}
    </>
  );
}

function PulseConnectionCardInner() {
  const qc = useQueryClient();
  const [diag, setDiag] = React.useState(false);

  const status = useQuery({
    queryKey: ["pulse-connection"],
    queryFn: () => checkPulseConnection(),
    staleTime: 60_000,
  });
  const su = useQuery({ queryKey: ["is-superadmin"], queryFn: () => amISuperadmin(), staleTime: 5 * 60_000 });
  const isSuper = su.data?.superadmin === true;

  const d = status.data;
  const writeOk = d?.connected === true;
  const readOk = d?.readAvailable === true;

  return (
    <Card className="p-4 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
          <Plug className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Inteligência Pedagógica</p>
            {status.isFetching ? (
              <RefreshCw className="size-4 text-muted-foreground animate-spin shrink-0" />
            ) : writeOk ? (
              <CheckCircle2 className="size-4 text-primary shrink-0" />
            ) : (
              <XCircle className="size-4 text-destructive shrink-0" />
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusPill tone={writeOk ? "ok" : "off"} label={writeOk ? "Envio ativo" : "API off"} />
            <StatusPill
              tone={readOk ? "ok" : writeOk ? "warn" : "off"}
              label={readOk ? "Leitura ativa" : "Leitura indisponível"}
            />
            {d?.tokenSource && <StatusPill tone="ok" label={d.tokenSource === "db" ? "Token: painel" : "Token: secret"} />}
          </div>

          {!readOk && (
            <p className="mt-2 text-[11px] text-muted-foreground flex items-start gap-1.5">
              <AlertTriangle className="size-3.5 text-accent shrink-0 mt-px" />
              As rotas de leitura responderam {d?.status === 0 ? "sem conexão" : "404/erro"} — o app segue com os dados locais/demo.
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground truncate">{d?.base}</p>

          <Button
            variant="outline"
            size="sm"
            className="mt-3 h-9 rounded-xl w-full"
            onClick={() => {
              qc.invalidateQueries({ queryKey: ["pulse-connection"] });
              status.refetch();
            }}
          >
            <RefreshCw className="size-3.5 mr-1.5" /> Testar conexão
          </Button>

          {isSuper && <TokenEditor onSaved={() => status.refetch()} />}

          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-8 rounded-lg w-full text-xs text-muted-foreground"
            onClick={() => setDiag((v) => !v)}
          >
            <Bug className="size-3.5 mr-1.5" /> {diag ? "Ocultar" : "Modo"} diagnóstico
          </Button>

          {diag && <Diagnostics status={d} />}
        </div>
      </div>
    </Card>
  );
}

function TokenEditor({ onSaved }: { onSaved: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [token, setToken] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");

  const settings = useQuery({
    queryKey: ["pulse-settings"],
    queryFn: () => getPulseSettings(),
    enabled: open,
  });

  const save = useMutation({
    mutationFn: () =>
      savePulseSettings({
        data: {
          ...(token.trim() ? { token: token.trim() } : {}),
          ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
        },
      }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Falha ao salvar");
        return;
      }
      setToken("");
      toast.success("Token atualizado — revalidando conexão...");
      clearPersistedQueries();
      qc.invalidateQueries({ queryKey: ["pulse-settings"] });
      qc.invalidateQueries({ queryKey: ["pulse-connection"] });
      qc.invalidateQueries({ queryKey: ["pulse-logs"] });
      onSaved();
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  return (
    <div className="mt-2">
      <Button variant="outline" size="sm" className="h-9 rounded-xl w-full" onClick={() => setOpen((v) => !v)}>
        <KeyRound className="size-3.5 mr-1.5" /> {open ? "Fechar" : "Configurar token"}
      </Button>
      {open && (
        <div className="mt-2 space-y-2 rounded-xl bg-secondary/40 p-3">
          <p className="text-[11px] text-muted-foreground">
            Token atual: <span className="font-mono">{settings.data?.tokenMasked ?? "—"}</span>
            {settings.data?.updatedAt && ` · alterado em ${new Date(settings.data.updatedAt).toLocaleString("pt-BR")}`}
          </p>
          <Input
            type="password"
            autoComplete="off"
            placeholder="Novo PULSE_API_TOKEN (pulse_...)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="h-10 rounded-xl font-mono text-xs"
          />
          <Input
            placeholder={settings.data?.baseUrl ?? "https://inteligenciapedagogica.lovable.app"}
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="h-10 rounded-xl text-xs"
          />
          <Button
            className="w-full h-10 rounded-xl"
            disabled={save.isPending || (!token.trim() && !baseUrl.trim())}
            onClick={() => save.mutate()}
          >
            <Save className="size-3.5 mr-1.5" /> {save.isPending ? "Salvando..." : "Salvar e testar"}
          </Button>
          <p className="text-[10px] text-muted-foreground">
            Guardado no backend com acesso restrito a superadmin. O app nunca expõe o valor completo.
          </p>
        </div>
      )}
    </div>
  );
}

function Diagnostics({ status }: { status: any }) {
  const logs = useQuery({ queryKey: ["pulse-logs"], queryFn: () => getPulseLogs(), staleTime: 15_000 });

  return (
    <div className="mt-2 rounded-xl bg-secondary/40 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-y-1 text-[11px]">
        <span className="text-muted-foreground">Assinatura</span>
        <span className="font-medium">{status?.signed ? "HMAC-SHA256 enviada" : "não enviada"}</span>
        <span className="text-muted-foreground">Último timestamp</span>
        <span className="font-mono truncate">{status?.ts ?? "—"}</span>
        <span className="text-muted-foreground">Último nonce</span>
        <span className="font-mono truncate">{status?.nonce ?? "—"}</span>
        <span className="text-muted-foreground">HTTP</span>
        <span className="font-mono">{status?.status ?? "—"}</span>
        <span className="text-muted-foreground">Motivo</span>
        <span className="font-mono break-all">{status?.reason ?? "ok"}</span>
      </div>

      <div className="pt-2 border-t border-border/60">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Últimas chamadas</p>
        {logs.isLoading && <p className="text-[11px] text-muted-foreground">Carregando...</p>}
        {(logs.data?.logs ?? []).length === 0 && !logs.isLoading && (
          <p className="text-[11px] text-muted-foreground">Sem registros (visível apenas para superadmin).</p>
        )}
        <div className="space-y-1 max-h-56 overflow-auto">
          {(logs.data?.logs ?? []).map((l: any) => (
            <div key={l.id} className="text-[10px] font-mono leading-tight">
              <div className="flex items-center gap-1.5">
                <Badge variant={l.signature_ok ? "secondary" : "destructive"} className="h-4 px-1 text-[9px]">
                  {l.status ?? "ERR"}
                </Badge>
                <span className="truncate">{l.resource}</span>
                <span className="text-muted-foreground ml-auto shrink-0">
                  {new Date(l.created_at).toLocaleTimeString("pt-BR")}
                </span>
              </div>
              {l.error && <p className="text-destructive break-all">{String(l.error).slice(0, 160)}</p>}
              <p className="text-muted-foreground break-all">ts {l.ts_used} · nonce {String(l.nonce_used ?? "").slice(0, 8)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

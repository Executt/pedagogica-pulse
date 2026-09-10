import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronRight,
  FileText,
  Lightbulb,
  MessageSquare,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskBadge } from "@/components/mobile-shell";
import { DemoBadge } from "@/components/query-state";
import { useSchoolDashboard } from "@/hooks/use-education";
import { useNetworkSchools } from "@/hooks/use-org";
import { averageAttendance, riskDistribution } from "@/domain/education/rules";

export const Route = createFileRoute("/_authenticated/escolas/$schoolId")({
  head: () => ({
    meta: [
      { title: "Painel da escola — Inteligência Pedagógica" },
      {
        name: "description",
        content:
          "Frequência, risco, observações, materiais e sugestões de uma escola da rede municipal.",
      },
      { property: "og:title", content: "Painel da escola — Inteligência Pedagógica" },
      {
        property: "og:description",
        content: "Indicadores pedagógicos consolidados por escola.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EscolaDashboard,
});

type Row = Record<string, unknown>;
const s = (v: unknown) => (typeof v === "string" ? v : "");

function EscolaDashboard() {
  const { schoolId } = Route.useParams();
  const navigate = useNavigate();
  const q = useSchoolDashboard(schoolId);
  const schools = useNetworkSchools();
  const school = (schools.data ?? []).find((x) => x.id === schoolId);

  const d = q.data?.data;
  const students = d?.students ?? [];
  const classes = d?.classes ?? [];
  const avg = averageAttendance(students);
  const risk = riskDistribution(students);
  const materials = (d?.materials ?? []) as Row[];
  const suggestions = (d?.suggestions ?? []) as Row[];
  const events = (d?.events ?? []) as Row[];
  const observations = d?.observations ?? [];

  return (
    <div className="app-shell flex flex-col">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border/60 px-3 h-14 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/escolas" })}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{school?.name ?? "Escola"}</h1>
          <p className="text-[11px] text-muted-foreground truncate">
            {school?.city ?? "Rede municipal"}
          </p>
        </div>
        {q.data?.source !== "api" && <DemoBadge />}
      </header>

      {q.isLoading && (
        <p className="text-sm text-muted-foreground text-center py-10">Carregando painel...</p>
      )}

      {!q.isLoading && (
        <Tabs defaultValue="overview" className="flex-1">
          <TabsList className="w-full grid grid-cols-4 h-11 rounded-none bg-background border-b sticky top-14 z-10">
            <TabsTrigger value="overview" className="text-xs rounded-none">Geral</TabsTrigger>
            <TabsTrigger value="students" className="text-xs rounded-none">Alunos</TabsTrigger>
            <TabsTrigger value="records" className="text-xs rounded-none">Registros</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs rounded-none">Sugestões</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Turmas" value={classes.length} />
              <Stat label="Alunos" value={students.length} />
              <Stat label="Risco alto" value={risk.high} />
            </div>

            <Card className="p-5 rounded-2xl">
              <p className="text-xs text-muted-foreground">Frequência média</p>
              <p className="text-3xl font-bold mt-1">
                {avg}
                <span className="text-lg text-muted-foreground">%</span>
              </p>
            </Card>

            <Card className="p-5 rounded-2xl space-y-3">
              <p className="text-sm font-semibold">Distribuição de risco</p>
              <RiskBar label="Regular" count={risk.low} total={students.length} color="bg-[oklch(0.72_0.14_150)]" />
              <RiskBar label="Atenção" count={risk.medium} total={students.length} color="bg-[oklch(0.78_0.15_75)]" />
              <RiskBar label="Risco alto" count={risk.high} total={students.length} color="bg-[oklch(0.62_0.2_25)]" />
            </Card>

            <Card className="p-4 rounded-2xl space-y-2">
              <p className="text-sm font-semibold">Turmas</p>
              {classes.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhuma turma nesta escola.</p>
              )}
              {classes.map((c) => (
                <Link key={c.id} to="/turmas/$classId" params={{ classId: c.id }}>
                  <div className="flex items-center gap-2 py-2 border-b last:border-0 border-border/50">
                    <Users className="size-4 text-primary" />
                    <span className="text-sm flex-1 truncate">{c.name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {c.students?.length ?? 0} alunos
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </Card>

            <Card className="p-4 rounded-2xl space-y-2">
              <p className="text-sm font-semibold inline-flex items-center gap-2">
                <CalendarIcon className="size-4 text-primary" /> Próximos eventos
              </p>
              {events.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum evento agendado.</p>
              )}
              {events.slice(0, 5).map((e, i) => (
                <div key={s(e["id"]) || i} className="py-1.5 border-b last:border-0 border-border/50">
                  <p className="text-sm">{s(e["title"])}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s(e["starts_at"]) &&
                      new Date(s(e["starts_at"])).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                  </p>
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="students" className="p-5 space-y-2">
            {students.length === 0 && <Empty icon={Users} text="Nenhum aluno nesta escola." />}
            {students.map((st) => (
              <Link key={st.id} to="/alunos/$studentId" params={{ studentId: st.id }}>
                <Card className="p-3 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <div className="size-11 rounded-full bg-secondary grid place-items-center text-primary font-semibold">
                    {st.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{st.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RiskBadge risk={st.risk} />
                      <span className="text-[10px] text-muted-foreground">
                        {Math.round(Number(st.attendance_rate) || 0)}% freq
                      </span>
                      {st.class_name && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {st.class_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Card>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="records" className="p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Materiais</p>
            {materials.length === 0 && <Empty icon={FileText} text="Nenhum material enviado." />}
            {materials.slice(0, 20).map((m, i) => (
              <Card key={s(m["id"]) || i} className="p-4 rounded-2xl flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <FileText className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s(m["name"])}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s(m["created_at"]) &&
                      new Date(s(m["created_at"])).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Card>
            ))}

            <p className="pt-3 text-xs font-semibold text-muted-foreground uppercase">Observações</p>
            {observations.length === 0 && (
              <Empty icon={MessageSquare} text="Nenhuma observação registrada." />
            )}
            {observations.slice(0, 20).map((o) => (
              <Card key={o.id} className="p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{o.type}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {o.created_at && new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm mt-1.5">{o.content}</p>
                {o.author && (
                  <p className="text-[11px] text-muted-foreground mt-1">{o.author}</p>
                )}
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="ai" className="p-5 space-y-2">
            {suggestions.length === 0 && (
              <Empty icon={Lightbulb} text="Nenhuma sugestão pedagógica no momento." />
            )}
            {suggestions.slice(0, 20).map((sg, i) => (
              <Card key={s(sg["id"]) || i} className="p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{s(sg["type"]) || "sugestão"}</Badge>
                  {s(sg["status"]) && (
                    <Badge variant="secondary" className="text-[10px]">{s(sg["status"])}</Badge>
                  )}
                </div>
                <p className="text-sm font-semibold mt-1.5">{s(sg["title"])}</p>
                <p className="text-xs text-muted-foreground mt-1">{s(sg["description"])}</p>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}

      <div style={{ height: 80 }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3 rounded-2xl text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </Card>
  );
}

function RiskBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-10 text-center">
      <Icon className="size-10 text-muted-foreground/40 mx-auto" />
      <p className="text-sm text-muted-foreground mt-2">{text}</p>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, FileText, Calendar as CalendarIcon, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/mobile-shell";

export const Route = createFileRoute("/_authenticated/turmas/$classId")({
  component: TurmaDetail,
});

function TurmaDetail() {
  const { classId } = Route.useParams();
  const navigate = useNavigate();

  const turma = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const [c, students, materials, events] = await Promise.all([
        supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
        supabase.from("students").select("*").eq("class_id", classId).order("full_name"),
        supabase.from("materials").select("*").eq("class_id", classId).order("created_at", { ascending: false }),
        supabase.from("events").select("*").eq("class_id", classId).order("starts_at"),
      ]);
      return {
        turma: c.data,
        students: students.data ?? [],
        materials: materials.data ?? [],
        events: events.data ?? [],
      };
    },
  });

  const d = turma.data;
  const avgAttendance = d?.students.length
    ? Math.round(d.students.reduce((s, x) => s + (Number(x.attendance_rate) || 0), 0) / d.students.length)
    : 0;
  const riskDist = {
    low: d?.students.filter((s) => s.risk === "low").length ?? 0,
    medium: d?.students.filter((s) => s.risk === "medium").length ?? 0,
    high: d?.students.filter((s) => s.risk === "high").length ?? 0,
  };

  return (
    <div className="app-shell flex flex-col">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border/60 px-3 h-14 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/turmas" })}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{d?.turma?.name ?? "Turma"}</h1>
          <p className="text-[11px] text-muted-foreground">{d?.turma?.grade}</p>
        </div>
      </header>

      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="w-full grid grid-cols-4 h-11 rounded-none bg-background border-b sticky top-14 z-10">
          <TabsTrigger value="overview" className="text-xs rounded-none">Geral</TabsTrigger>
          <TabsTrigger value="students" className="text-xs rounded-none">Alunos</TabsTrigger>
          <TabsTrigger value="materials" className="text-xs rounded-none">Materiais</TabsTrigger>
          <TabsTrigger value="agenda" className="text-xs rounded-none">Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="p-5 space-y-4">
          <Card className="p-5 rounded-2xl">
            <p className="text-xs text-muted-foreground">Frequência média</p>
            <p className="text-3xl font-bold mt-1">{avgAttendance}<span className="text-lg text-muted-foreground">%</span></p>
          </Card>
          <Card className="p-5 rounded-2xl space-y-3">
            <p className="text-sm font-semibold">Distribuição de risco</p>
            <RiskBar label="Regular" count={riskDist.low} total={d?.students.length ?? 0} color="bg-[oklch(0.72_0.14_150)]" />
            <RiskBar label="Atenção" count={riskDist.medium} total={d?.students.length ?? 0} color="bg-[oklch(0.78_0.15_75)]" />
            <RiskBar label="Risco alto" count={riskDist.high} total={d?.students.length ?? 0} color="bg-[oklch(0.62_0.2_25)]" />
          </Card>
        </TabsContent>

        <TabsContent value="students" className="p-5 space-y-2">
          {d?.students.map((s) => (
            <Link key={s.id} to="/alunos/$studentId" params={{ studentId: s.id }}>
              <Card className="p-3 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-transform">
                <div className="size-11 rounded-full bg-secondary grid place-items-center text-primary font-semibold">
                  {s.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{s.full_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <RiskBadge risk={s.risk as any} />
                    <span className="text-[10px] text-muted-foreground">{Math.round(Number(s.attendance_rate))}% freq</span>
                    {s.has_pei && <span className="text-[10px] font-medium text-info">PEI</span>}
                  </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </TabsContent>

        <TabsContent value="materials" className="p-5 space-y-2">
          {d?.materials.length === 0 && <EmptyState icon={FileText} text="Nenhum material compartilhado." />}
          {d?.materials.map((m) => (
            <Card key={m.id} className="p-4 rounded-2xl flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center"><FileText className="size-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="agenda" className="p-5 space-y-2">
          {d?.events.length === 0 && <EmptyState icon={CalendarIcon} text="Nenhum evento agendado." />}
          {d?.events.map((e) => (
            <Card key={e.id} className="p-4 rounded-2xl">
              <p className="text-sm font-semibold">{e.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.starts_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
              {e.location && <p className="text-xs text-muted-foreground mt-1">📍 {e.location}</p>}
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div style={{ height: 80 }} />
    </div>
  );
}

function RiskBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
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

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="py-10 text-center">
      <Icon className="size-10 text-muted-foreground/40 mx-auto" />
      <p className="text-sm text-muted-foreground mt-2">{text}</p>
    </div>
  );
}

// silence unused
export { User };
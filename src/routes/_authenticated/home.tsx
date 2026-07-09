import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRoles, useMyProfile } from "@/hooks/use-current-user";
import { MobileShell, RiskBadge } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Sparkles, Users, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/home")({
  component: HomePage,
});

function HomePage() {
  const profile = useMyProfile();
  const roles = useMyRoles();
  const schoolIds = roles.data?.map((r) => r.school_id) ?? [];

  const stats = useQuery({
    queryKey: ["dashboard-stats", schoolIds],
    enabled: schoolIds.length > 0,
    queryFn: async () => {
      const [classes, students, suggestions, events] = await Promise.all([
        supabase.from("classes").select("id", { count: "exact", head: true }).in("school_id", schoolIds),
        supabase.from("students").select("id, risk"),
        supabase.from("ai_suggestions").select("id", { count: "exact", head: true }).eq("status", "pending").in("school_id", schoolIds),
        supabase.from("events").select("id, title, starts_at").in("school_id", schoolIds).gte("starts_at", new Date().toISOString()).order("starts_at").limit(3),
      ]);
      const studentsData = students.data ?? [];
      return {
        classCount: classes.count ?? 0,
        studentCount: studentsData.length,
        highRisk: studentsData.filter((s) => s.risk === "high").length,
        pendingSuggestions: suggestions.count ?? 0,
        upcomingEvents: events.data ?? [],
      };
    },
  });

  const primaryRole = roles.data?.[0]?.role;
  const roleLabel = primaryRole === "diretor" ? "Diretor(a)" : primaryRole === "pedagogo" ? "Pedagogo(a)" : "Professor(a)";

  if (roles.isSuccess && roles.data.length === 0) {
    return (
      <MobileShell title="Início">
        <div className="p-6">
          <Card className="p-6 text-center rounded-2xl">
            <Users className="size-10 text-primary mx-auto" />
            <h2 className="mt-3 font-semibold">Vincule-se a uma escola</h2>
            <p className="text-sm text-muted-foreground mt-1">Você ainda não tem um papel definido. Configure em Perfil.</p>
            <Button asChild className="mt-4 rounded-xl"><Link to="/perfil">Configurar perfil</Link></Button>
          </Card>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="px-5 pt-8 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{roleLabel}</p>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Olá, {profile.data?.full_name?.split(" ")[0] ?? "educador"} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{roles.data?.[0]?.schools?.name ?? "—"}</p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Alunos" value={stats.data?.studentCount ?? "—"} tint="primary" />
        <StatCard icon={TrendingUp} label="Turmas" value={stats.data?.classCount ?? "—"} tint="info" />
        <StatCard icon={Sparkles} label="Sugestões IA" value={stats.data?.pendingSuggestions ?? "—"} tint="accent" href="/curadoria" />
        <StatCard icon={AlertTriangle} label="Risco alto" value={stats.data?.highRisk ?? "—"} tint="danger" />
      </div>

      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Próximos eventos</h2>
          <Link to="/agenda" className="text-xs text-primary font-medium">Ver tudo</Link>
        </div>
        <div className="space-y-2">
          {stats.data?.upcomingEvents.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento próximo.</p>
          )}
          {stats.data?.upcomingEvents.map((e) => (
            <Card key={e.id} className="p-4 rounded-2xl flex items-center gap-3">
              <div className="size-11 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 text-center">
                <div className="leading-tight">
                  <div className="text-[10px] uppercase">{new Date(e.starts_at).toLocaleDateString("pt-BR", { month: "short" })}</div>
                  <div className="text-base font-bold">{new Date(e.starts_at).getDate()}</div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Atalhos</h2>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <QuickLink to="/turmas" label="Ver minhas turmas" icon={Users} />
          <QuickLink to="/curadoria" label="Curar sugestões da IA" icon={Sparkles} />
          <QuickLink to="/comunicados" label="Mural de comunicados" icon={TrendingUp} />
        </div>
      </section>
    </MobileShell>
  );
}

function StatCard({ icon: Icon, label, value, tint, href }: {
  icon: React.ElementType; label: string; value: React.ReactNode; tint: "primary" | "info" | "accent" | "danger"; href?: string;
}) {
  const tintCls = {
    primary: "bg-primary/10 text-primary",
    info: "bg-[oklch(0.6_0.13_235/0.12)] text-[oklch(0.5_0.13_235)]",
    accent: "bg-accent/15 text-accent",
    danger: "bg-destructive/10 text-destructive",
  }[tint];
  const inner = (
    <Card className="p-4 rounded-2xl">
      <div className={`size-9 rounded-xl grid place-items-center ${tintCls}`}><Icon className="size-4" /></div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

function QuickLink({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 active:scale-[0.98] transition-transform">
      <div className="size-9 rounded-xl bg-primary/10 text-primary grid place-items-center"><Icon className="size-4" /></div>
      <span className="flex-1 font-medium text-sm">{label}</span>
      <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}

// silence unused
export { RiskBadge };
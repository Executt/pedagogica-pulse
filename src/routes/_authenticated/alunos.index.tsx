import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useStudents } from "@/hooks/use-education";
import { usePaginated } from "@/hooks/use-paginated";
import { DemoBadge, ErrorRetry, LoadMore } from "@/components/query-state";
import { EMPTY_SCOPE, OrgScopeFilter, useOrgScope, type OrgScope } from "@/components/org-scope-filter";
import { filterBySchoolScope } from "@/domain/org/scope";

export const Route = createFileRoute("/_authenticated/alunos/")({
  head: () => ({
    meta: [
      { title: "Alunos da rede — Inteligência Pedagógica" },
      {
        name: "description",
        content: "Lista de alunos filtrável por regional, distrito e escola dentro do seu escopo.",
      },
      { property: "og:title", content: "Alunos da rede — Inteligência Pedagógica" },
      { property: "og:description", content: "Busque alunos por hierarquia organizacional e turma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AlunosList,
});

const RISK_LABEL = { high: "Alto risco", medium: "Atenção", low: "Estável" } as const;

function AlunosList() {
  const [scope, setScope] = useState<OrgScope>(EMPTY_SCOPE);
  const [q, setQ] = useState("");
  const students = useStudents();
  const { allowedSchoolIds } = useOrgScope(scope);

  const items = students.data?.data ?? [];
  const scoped = filterBySchoolScope(items, scope, allowedSchoolIds);
  const filtered = scoped.filter((s) =>
    (s.full_name + " " + (s.class_name ?? "")).toLowerCase().includes(q.toLowerCase()),
  );
  const page = usePaginated(filtered, 15);

  return (
    <MobileShell
      title="Alunos"
      action={students.data?.source === "mock" ? <DemoBadge /> : undefined}
    >
      <div className="px-5 pt-4 pb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 pl-10 rounded-xl bg-secondary/50 border-transparent"
          />
        </div>
        <OrgScopeFilter value={scope} onChange={setScope} />

        {students.isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        )}
        {students.isError && (
          <ErrorRetry error={students.error} onRetry={() => students.refetch()} usingFallback />
        )}
        {!students.isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum aluno no escopo atual.</p>
        )}

        {page.visible.map((s) => (
          <Link key={s.id} to="/alunos/$studentId" params={{ studentId: s.id }}>
            <Card className="p-4 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold shrink-0">
                {s.full_name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{s.full_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {s.class_name ?? "sem turma"} · {RISK_LABEL[s.risk]} · {Math.round(s.attendance_rate ?? 0)}% presença
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Card>
          </Link>
        ))}
        <LoadMore hasMore={page.hasMore} onMore={page.loadMore} />
      </div>
    </MobileShell>
  );
}
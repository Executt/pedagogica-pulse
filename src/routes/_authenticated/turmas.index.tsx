import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ChevronRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/mobile-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/turmas/")({
  component: TurmasList,
});

function TurmasList() {
  const [q, setQ] = useState("");
  const classes = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, grade, year, students(id, risk)")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (classes.data ?? []).filter((c) =>
    (c.name + " " + c.grade).toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <MobileShell title="Turmas">
      <div className="px-5 pt-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar turma..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 pl-10 rounded-xl bg-secondary/50 border-transparent"
          />
        </div>

        <div className="mt-4 space-y-2">
          {classes.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
          {filtered.length === 0 && !classes.isLoading && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma turma encontrada.</p>
          )}
          {filtered.map((c) => {
            const total = c.students?.length ?? 0;
            const highRisk = (c.students ?? []).filter((s: any) => s.risk === "high").length;
            return (
              <Link key={c.id} to="/turmas/$classId" params={{ classId: c.id }}>
                <Card className="p-4 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-transform">
                  <div className="size-12 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0 font-bold">
                    {c.name.split(" ")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.grade} · {c.year}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs inline-flex items-center gap-1 text-muted-foreground"><Users className="size-3" /> {total}</span>
                      {highRisk > 0 && (
                        <span className="text-xs font-medium text-destructive">{highRisk} em risco</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
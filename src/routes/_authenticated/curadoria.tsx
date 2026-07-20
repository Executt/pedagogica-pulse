import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSmartQuery } from "@/hooks/use-smart-query";
import { usePaginated } from "@/hooks/use-paginated";
import { ErrorRetry, LoadMore, DemoBadge } from "@/components/query-state";
import { getMockData, useMockMode } from "@/lib/mock-mode";

type Status = "pending" | "applied" | "scheduled" | "discarded";

export const Route = createFileRoute("/_authenticated/curadoria")({
  component: Curadoria,
});

function Curadoria() {
  const [status, setStatus] = useState<Status>("pending");
  const mock = useMockMode();
  const q = useSmartQuery<any[]>({
    queryKey: ["suggestions", status],
    apiFn: async () => {
      const { data, error } = await supabase
        .from("ai_suggestions")
        .select("*, classes(name), students(full_name)")
        .eq("status", status)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    mockFn: () => getMockData().suggestions.filter((s) => s.status === status),
  });
  const items = q.data?.data ?? [];
  const page = usePaginated(items, 8);

  return (
    <MobileShell title="Curadoria da IA" action={q.data?.source === "mock" || mock ? <DemoBadge /> : undefined}>
      <div className="px-5 pt-4">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList className="grid grid-cols-4 h-10 w-full rounded-xl">
            <TabsTrigger value="pending" className="text-xs rounded-lg">Pendentes</TabsTrigger>
            <TabsTrigger value="applied" className="text-xs rounded-lg">Aplicadas</TabsTrigger>
            <TabsTrigger value="scheduled" className="text-xs rounded-lg">Agendadas</TabsTrigger>
            <TabsTrigger value="discarded" className="text-xs rounded-lg">Descartadas</TabsTrigger>
          </TabsList>
          <TabsContent value={status} className="mt-4 space-y-3">
            {q.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
            {q.isError && <ErrorRetry error={q.error} onRetry={() => q.refetch()} usingFallback />}
            {!q.isLoading && !q.isError && items.length === 0 && (
              <div className="py-12 text-center">
                <Sparkles className="size-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Nada por aqui.</p>
              </div>
            )}
            {page.visible.map((s) => <SuggestionCard key={s.id} s={s} />)}
            <LoadMore hasMore={page.hasMore} onMore={page.loadMore} />
          </TabsContent>
        </Tabs>
      </div>
    </MobileShell>
  );
}

function SuggestionCard({ s }: { s: any }) {
  const qc = useQueryClient();
  const user = useCurrentUser();
  const typeColor: Record<string, string> = {
    reforco: "bg-info/15 text-info",
    emocional: "bg-accent/15 text-accent",
    encaminhamento: "bg-destructive/10 text-destructive",
    engajamento: "bg-primary/10 text-primary",
    outro: "bg-muted text-muted-foreground",
  };
  const m = useMutation({
    mutationFn: async (next: Status) => {
      const { error } = await supabase.from("ai_suggestions")
        .update({ status: next, handled_by: user?.id ?? null, handled_at: new Date().toISOString() })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suggestions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Sugestão atualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="p-4 rounded-2xl">
      <div className="flex items-start gap-2">
        <Sparkles className="size-4 text-accent mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${typeColor[s.type] || ""}`}>{s.type}</span>
            <span className="text-[10px] text-muted-foreground">
              {s.students?.full_name ? `Aluno: ${s.students.full_name}` : s.classes?.name ? `Turma: ${s.classes.name}` : "Escola"}
            </span>
          </div>
          <p className="text-sm font-semibold">{s.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
        </div>
      </div>
      {s.status === "pending" && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={() => m.mutate("scheduled")} className="rounded-xl h-9 text-xs">
            <Clock className="size-3.5 mr-1" /> Agendar
          </Button>
          <Button size="sm" onClick={() => m.mutate("applied")} className="rounded-xl h-9 text-xs">
            <Check className="size-3.5 mr-1" /> Aplicar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => m.mutate("discarded")} className="rounded-xl h-9 text-xs text-muted-foreground">
            <X className="size-3.5 mr-1" /> Descartar
          </Button>
        </div>
      )}
    </Card>
  );
}
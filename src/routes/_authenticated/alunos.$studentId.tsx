import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Send, Sparkles, MessageSquare, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RiskBadge } from "@/components/mobile-shell";
import { useSmartQuery } from "@/hooks/use-smart-query";
import { getMockStudentDetail } from "@/lib/mock-mode";
import { DemoBadge } from "@/components/query-state";

export const Route = createFileRoute("/_authenticated/alunos/$studentId")({
  component: AlunoDetail,
});

function AlunoDetail() {
  const { studentId } = Route.useParams();
  const navigate = useNavigate();

  const q = useSmartQuery<any>({
    queryKey: ["student", studentId],
    apiFn: async () => {
      const [s, obs, sug] = await Promise.all([
        supabase.from("students").select("*, classes(name, grade)").eq("id", studentId).maybeSingle(),
        supabase.from("observations").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
        supabase.from("ai_suggestions").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
      ]);
      return { student: s.data, observations: obs.data ?? [], suggestions: sug.data ?? [] };
    },
    mockFn: () =>
      getMockStudentDetail(studentId) ?? { student: null, observations: [], suggestions: [] },
  });

  const d: any = q.data?.data;
  const s = d?.student;
  const skills: { label: string; value: number }[] = s?.skills ?? [
    { label: "Leitura", value: 78 },
    { label: "Escrita", value: 65 },
    { label: "Matemática", value: 72 },
    { label: "Interpretação", value: 58 },
  ];

  return (
    <div className="app-shell flex flex-col">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b px-3 h-14 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/turmas" })}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{s?.full_name ?? "Aluno"}</h1>
          <p className="text-[11px] text-muted-foreground">{s?.classes?.name}</p>
        </div>
        {q.data?.source === "mock" && <DemoBadge />}
      </header>

      <div className="px-5 pt-5 pb-2 flex items-center gap-4">
        <div className="size-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground grid place-items-center text-xl font-bold">
          {s?.full_name?.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">{s?.full_name}</p>
          <div className="flex items-center gap-2 mt-1">
            {s?.risk && <RiskBadge risk={s.risk as any} />}
            {s?.has_pei && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-info/15 text-info">PEI</span>}
          </div>
          {s?.guardian_name && <p className="text-xs text-muted-foreground mt-1">Resp.: {s.guardian_name}</p>}
        </div>
      </div>

      <Tabs defaultValue="perf" className="flex-1 mt-3">
        <TabsList className="w-full grid grid-cols-3 h-11 rounded-none bg-background border-b sticky top-14 z-10">
          <TabsTrigger value="perf" className="text-xs rounded-none">Desempenho</TabsTrigger>
          <TabsTrigger value="obs" className="text-xs rounded-none">Observações</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs rounded-none">Sugestões IA</TabsTrigger>
        </TabsList>

        <TabsContent value="perf" className="p-5 space-y-4">
          <Card className="p-5 rounded-2xl">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><TrendingUp className="size-3.5" /> Frequência</div>
            <p className="text-3xl font-bold mt-1">{Math.round(Number(s?.attendance_rate ?? 0))}<span className="text-lg text-muted-foreground">%</span></p>
          </Card>
          <Card className="p-5 rounded-2xl">
            <p className="text-sm font-semibold mb-3">Habilidades (mock)</p>
            {skills.map((sk) => <SkillBar key={sk.label} label={sk.label} value={sk.value} />)}
          </Card>
        </TabsContent>

        <TabsContent value="obs" className="p-5 space-y-3">
          <NewObservation studentId={studentId} />
          {d?.observations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma observação ainda.</p>
          )}
          {d?.observations.map((o: any) => (
            <Card key={o.id} className="p-4 rounded-2xl">
              <div className="flex items-start gap-2">
                <MessageSquare className="size-4 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{o.content}</p>
                  <p className="text-[11px] text-muted-foreground mt-2">{new Date(o.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ai" className="p-5 space-y-3">
          {d?.suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Sem sugestões para este aluno.</p>
          )}
          {d?.suggestions.map((sg: any) => (
            <Card key={sg.id} className="p-4 rounded-2xl">
              <div className="flex items-start gap-2">
                <Sparkles className="size-4 text-accent mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{sg.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sg.description}</p>
                  <p className="text-[10px] uppercase mt-2 font-semibold text-muted-foreground">{sg.status}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <div style={{ height: 80 }} />
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1"><span>{label}</span><span className="text-muted-foreground">{value}%</span></div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function NewObservation({ studentId }: { studentId: string }) {
  const [text, setText] = useState("");
  const user = useCurrentUser();
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("observations").insert({
        student_id: studentId, author_id: user.id, type: "text", content: text,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      toast.success("Observação registrada");
    },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card className="p-3 rounded-2xl">
      <Textarea placeholder="Escreva uma observação (diário de bordo)..." value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[70px] border-none focus-visible:ring-0 resize-none p-2" />
      <div className="flex justify-end mt-2">
        <Button size="sm" onClick={() => m.mutate()} disabled={!text.trim() || m.isPending} className="rounded-xl">
          <Send className="size-3.5 mr-1" /> Registrar
        </Button>
      </div>
    </Card>
  );
}
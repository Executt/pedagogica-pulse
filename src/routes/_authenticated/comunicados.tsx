import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useMyRoles } from "@/hooks/use-current-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSmartQuery } from "@/hooks/use-smart-query";
import { usePaginated } from "@/hooks/use-paginated";
import { ErrorRetry, LoadMore, DemoBadge } from "@/components/query-state";
import { getMockData } from "@/lib/mock-mode";

export const Route = createFileRoute("/_authenticated/comunicados")({
  component: Comunicados,
});

function Comunicados() {
  const navigate = useNavigate();
  const q = useSmartQuery<any[]>({
    queryKey: ["announcements"],
    apiFn: async () => {
      const { data, error } = await supabase.from("announcements")
        .select("*, schools(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    mockFn: () => getMockData().announcements,
  });
  const items = q.data?.data ?? [];
  const page = usePaginated(items, 8);

  return (
    <div className="app-shell flex flex-col">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b px-3 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/perfil" })}><ArrowLeft className="size-5" /></Button>
          <h1 className="font-semibold text-sm">Comunicados</h1>
        </div>
        <div className="flex items-center gap-2">
          {q.data?.source === "mock" && <DemoBadge />}
          <NewAnnouncementSheet />
        </div>
      </header>

      <div className="px-5 pt-4 pb-24 space-y-2">
        {q.isError && <ErrorRetry error={q.error} onRetry={() => q.refetch()} usingFallback />}
        {!q.isError && items.length === 0 && (
          <div className="py-16 text-center">
            <Megaphone className="size-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Sem comunicados no mural.</p>
          </div>
        )}
        {page.visible.map((a) => (
          <Card key={a.id} className="p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="size-3.5 text-accent" />
              <span className="text-[10px] uppercase font-bold text-accent">{a.school_id ? a.schools?.name : "Geral"}</span>
            </div>
            <p className="font-semibold text-sm">{a.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{a.body}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
          </Card>
        ))}
        <LoadMore hasMore={page.hasMore} onMore={page.loadMore} />
      </div>
    </div>
  );
}

function NewAnnouncementSheet() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const user = useCurrentUser();
  const roles = useMyRoles();
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sem usuário");
      const { error } = await supabase.from("announcements").insert({
        title, body, author_id: user.id, school_id: roles.data?.[0]?.school_id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false); setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Comunicado publicado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button size="icon" className="rounded-full size-9"><Plus className="size-4" /></Button></SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>Novo comunicado</SheetTitle></SheetHeader>
        <form className="mt-4 space-y-3 px-4 pb-6" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11 rounded-xl mt-1" /></div>
          <div><Label>Mensagem</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} required className="rounded-xl mt-1 min-h-[100px]" /></div>
          <Button type="submit" disabled={m.isPending} className="w-full h-11 rounded-xl">{m.isPending ? "Publicando..." : "Publicar"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
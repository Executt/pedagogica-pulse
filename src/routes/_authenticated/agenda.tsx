import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useMyRoles } from "@/hooks/use-current-user";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: Agenda,
});

function Agenda() {
  const q = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events")
        .select("*, classes(name)")
        .order("starts_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const grouped = groupByDay(q.data ?? []);

  return (
    <MobileShell title="Agenda" action={<NewEventSheet />}>
      <div className="px-5 pt-4 space-y-6">
        {q.isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {Object.keys(grouped).length === 0 && !q.isLoading && (
          <div className="py-16 text-center">
            <CalendarIcon className="size-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Nenhum evento na agenda.</p>
          </div>
        )}
        {Object.entries(grouped).map(([day, events]) => (
          <div key={day}>
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{day}</p>
            <div className="space-y-2">
              {events.map((e) => (
                <Card key={e.id} className="p-4 rounded-2xl">
                  <p className="text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(e.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {e.classes?.name && ` · ${e.classes.name}`}
                  </p>
                  {e.location && (
                    <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1"><MapPin className="size-3" /> {e.location}</p>
                  )}
                  {e.description && <p className="text-xs mt-2">{e.description}</p>}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

function groupByDay(events: any[]) {
  const map: Record<string, any[]> = {};
  for (const e of events) {
    const key = new Date(e.starts_at).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
    (map[key] ??= []).push(e);
  }
  return map;
}

function NewEventSheet() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState("");
  const user = useCurrentUser();
  const roles = useMyRoles();
  const qc = useQueryClient();

  const m = useMutation({
    mutationFn: async () => {
      if (!user || !roles.data?.[0]) throw new Error("Sem escola vinculada");
      const { error } = await supabase.from("events").insert({
        title, description, location,
        starts_at: new Date(when).toISOString(),
        school_id: roles.data[0].school_id,
        creator_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false); setTitle(""); setDescription(""); setLocation(""); setWhen("");
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Evento criado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" className="rounded-full size-9"><Plus className="size-4" /></Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh]">
        <SheetHeader><SheetTitle>Novo evento</SheetTitle></SheetHeader>
        <form className="mt-4 space-y-3 px-4 pb-6" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-11 rounded-xl mt-1" /></div>
          <div><Label>Data e hora</Label><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required className="h-11 rounded-xl mt-1" /></div>
          <div><Label>Local</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11 rounded-xl mt-1" /></div>
          <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl mt-1" /></div>
          <Button type="submit" disabled={m.isPending} className="w-full h-11 rounded-xl">{m.isPending ? "Salvando..." : "Criar evento"}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
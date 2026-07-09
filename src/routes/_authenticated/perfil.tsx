import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { LogOut, Megaphone, ChevronRight, School, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useMyProfile, useMyRoles } from "@/hooks/use-current-user";
import { MobileShell } from "@/components/mobile-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: Perfil,
});

function Perfil() {
  const user = useCurrentUser();
  const profile = useMyProfile();
  const roles = useMyRoles();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

        <Card className="rounded-2xl overflow-hidden divide-y divide-border/60">
          <Link to="/comunicados" className="flex items-center gap-3 p-4 active:bg-secondary/50">
            <Megaphone className="size-4 text-primary" />
            <span className="flex-1 text-sm font-medium">Mural de comunicados</span>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
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

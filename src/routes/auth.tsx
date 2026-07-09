import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Inteligência Pedagógica" },
      { name: "description", content: "Acesse sua conta como Professor, Pedagogo ou Diretor." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/home", replace: true });
  }, [user, navigate]);

  return (
    <div className="app-shell px-6 pt-8 pb-8 flex flex-col">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground w-fit">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="mt-8 flex items-center gap-2">
        <div className="size-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
          <GraduationCap className="size-5" />
        </div>
        <span className="font-semibold text-lg">Inteligência Pedagógica</span>
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight">Bem-vindo(a)</h1>
      <p className="text-sm text-muted-foreground mt-1">Entre ou crie sua conta em segundos.</p>

      <Tabs defaultValue="signin" className="mt-6">
        <TabsList className="grid grid-cols-2 w-full h-11 rounded-xl">
          <TabsTrigger value="signin" className="rounded-lg">Entrar</TabsTrigger>
          <TabsTrigger value="signup" className="rounded-lg">Criar conta</TabsTrigger>
        </TabsList>
        <TabsContent value="signin"><SignInForm /></TabsContent>
        <TabsContent value="signup"><SignUpForm /></TabsContent>
      </Tabs>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo(a) de volta!");
  }

  return (
    <form onSubmit={handle} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="in-email">E-mail</Label>
        <Input id="in-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl" autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="in-pass">Senha</Label>
        <Input id="in-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl" autoComplete="current-password" />
      </div>
      <Button type="submit" disabled={loading} size="lg" className="w-full h-12 rounded-xl">
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/home`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Redirecionando...");
  }

  return (
    <form onSubmit={handle} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="up-name">Nome completo</Label>
        <Input id="up-name" required value={name} onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-xl" autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="up-email">E-mail</Label>
        <Input id="up-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl" autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="up-pass">Senha</Label>
        <Input id="up-pass" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
          className="h-12 rounded-xl" autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
      </div>
      <Button type="submit" disabled={loading} size="lg" className="w-full h-12 rounded-xl">
        {loading ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
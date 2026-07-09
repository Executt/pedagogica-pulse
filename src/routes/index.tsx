import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GraduationCap, Sparkles, Users, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const user = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/home", replace: true });
  }, [user, navigate]);

  return (
    <div className="app-shell flex flex-col">
      <div className="flex-1 px-6 pt-14 pb-8 flex flex-col">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center">
            <GraduationCap className="size-5" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Inteligência Pedagógica</span>
        </div>

        <div className="mt-14">
          <h1 className="text-4xl font-bold tracking-tight leading-[1.05]">
            O copiloto do educador,<br />
            <span className="text-primary">no bolso.</span>
          </h1>
          <p className="mt-4 text-muted-foreground text-base leading-relaxed">
            Turmas, alunos, curadoria de sugestões da IA e comunicação com famílias — tudo em um só app.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <Feature icon={Sparkles} title="IA que ajuda de verdade" desc="Sugestões pedagógicas contextuais por aluno e turma." />
          <Feature icon={Users} title="Foco no aluno" desc="Diário de bordo, evolução e sinais emocionais." />
          <Feature icon={MessageCircle} title="Comunicação simples" desc="Comunicados, agenda e famílias no mesmo lugar." />
        </div>

        <div className="mt-auto pt-8 space-y-3">
          <Button asChild size="lg" className="w-full rounded-2xl h-12 text-base">
            <Link to="/auth">Entrar</Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Perfis: Professor, Pedagogo e Diretor.
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-secondary/50 border border-border/50">
      <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

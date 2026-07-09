import { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Users, Sparkles, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/turmas", label: "Turmas", icon: Users },
  { to: "/curadoria", label: "IA", icon: Sparkles },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function MobileShell({ children, title, action }: { children: ReactNode; title?: string; action?: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="app-shell flex flex-col">
      {title && (
        <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border/60 px-5 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-base tracking-tight truncate">{title}</h1>
          {action}
        </header>
      )}
      <main className="flex-1 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-background/95 backdrop-blur-lg border-t border-border/60 safe-bottom">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((t) => {
            const active = pathname === t.to || pathname.startsWith(t.to + "/");
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "scale-110")} strokeWidth={active ? 2.5 : 2} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function RiskBadge({ risk }: { risk: "low" | "medium" | "high" }) {
  const map = {
    low: { label: "Regular", cls: "bg-[oklch(0.72_0.14_150/0.15)] text-[oklch(0.4_0.14_150)]" },
    medium: { label: "Atenção", cls: "bg-[oklch(0.78_0.15_75/0.2)] text-[oklch(0.45_0.15_75)]" },
    high: { label: "Risco alto", cls: "bg-[oklch(0.62_0.2_25/0.15)] text-[oklch(0.5_0.2_25)]" },
  } as const;
  const v = map[risk];
  return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", v.cls)}>{v.label}</span>;
}
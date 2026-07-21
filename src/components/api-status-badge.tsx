import { CheckCircle2, AlertTriangle, Database, WifiOff } from "lucide-react";
import { useMockMode } from "@/lib/mock-mode";
import { useApiHealth, getApiStatus } from "@/lib/api-health";
import { cn } from "@/lib/utils";

/**
 * Indicador global de status: modo demo, API ok, degradada ou em cooldown.
 */
export function ApiStatusBadge({ className }: { className?: string }) {
  const mock = useMockMode();
  useApiHealth();
  const status = getApiStatus(mock);

  if (mock) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent", className)}>
        <Database className="size-3" /> Demo
      </span>
    );
  }
  if (status === "cooldown") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-destructive/15 text-destructive", className)}>
        <WifiOff className="size-3" /> API off
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[oklch(0.78_0.15_75/0.2)] text-[oklch(0.45_0.15_75)]", className)}>
        <AlertTriangle className="size-3" /> Instável
      </span>
    );
  }
  if (status === "ok") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[oklch(0.72_0.14_150/0.15)] text-[oklch(0.4_0.14_150)]", className)}>
        <CheckCircle2 className="size-3" /> API
      </span>
    );
  }
  return null;
}
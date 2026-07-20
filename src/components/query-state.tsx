import { AlertCircle, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ErrorRetry({
  error, onRetry, usingFallback,
}: { error: unknown; onRetry: () => void; usingFallback?: boolean }) {
  const msg = error instanceof Error ? error.message : "Falha ao carregar dados";
  return (
    <Card className="p-4 rounded-2xl border-destructive/30 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">Não foi possível carregar</p>
          <p className="text-xs text-muted-foreground mt-0.5 break-words">{msg}</p>
          {usingFallback && (
            <p className="text-[11px] text-muted-foreground mt-1 inline-flex items-center gap-1">
              <Database className="size-3" /> Exibindo dados de exemplo
            </p>
          )}
          <Button size="sm" variant="outline" onClick={onRetry} className="mt-2 h-8 rounded-lg text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Tentar novamente
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function LoadMore({
  hasMore, onMore, loading,
}: { hasMore: boolean; onMore: () => void; loading?: boolean }) {
  if (!hasMore) return null;
  return (
    <div className="pt-2 pb-4 text-center">
      <Button variant="outline" size="sm" className="rounded-xl" onClick={onMore} disabled={loading}>
        {loading ? "Carregando..." : "Carregar mais"}
      </Button>
    </div>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent">
      <Database className="size-3" /> Demo
    </span>
  );
}
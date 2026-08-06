import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, School as SchoolIcon, MapPin } from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePaginated } from "@/hooks/use-paginated";
import { LoadMore } from "@/components/query-state";
import { EMPTY_SCOPE, OrgScopeFilter, useOrgScope, type OrgScope } from "@/components/org-scope-filter";
import { orgUnitPath } from "@/domain/org/rules";

export const Route = createFileRoute("/_authenticated/escolas")({
  head: () => ({
    meta: [
      { title: "Escolas da rede — Inteligência Pedagógica" },
      {
        name: "description",
        content: "Navegue pelas escolas da rede municipal filtrando por secretaria, regional e distrito.",
      },
      { property: "og:title", content: "Escolas da rede — Inteligência Pedagógica" },
      { property: "og:description", content: "Escolas por regional e distrito dentro do seu escopo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EscolasPage,
});

function EscolasPage() {
  const [scope, setScope] = useState<OrgScope>(EMPTY_SCOPE);
  const [q, setQ] = useState("");
  const { units, visibleSchools, isLoading } = useOrgScope(scope);

  const list = visibleSchools
    .filter((s) => (scope.schoolId ? s.id === scope.schoolId : true))
    .filter((s) => (s.name + " " + (s.city ?? "")).toLowerCase().includes(q.toLowerCase()));
  const page = usePaginated(list, 15);

  return (
    <MobileShell title="Escolas">
      <div className="px-5 pt-4 pb-8 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar escola..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 pl-10 rounded-xl bg-secondary/50 border-transparent"
          />
        </div>
        <OrgScopeFilter value={scope} onChange={setScope} />

        {isLoading && <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>}
        {!isLoading && list.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma escola no escopo atual.</p>
        )}

        {page.visible.map((s) => (
          <Card key={s.id} className="p-4 rounded-2xl flex items-start gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <SchoolIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">{s.name}</p>
              {s.org_unit_id && (
                <p className="text-[11px] text-muted-foreground truncate">
                  {orgUnitPath(units, s.org_unit_id)}
                </p>
              )}
              {(s.address || s.city) && (
                <p className="mt-0.5 text-[11px] text-muted-foreground truncate inline-flex items-center gap-1">
                  <MapPin className="size-3" /> {s.address ?? s.city}
                </p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {s.inep_code && <Badge variant="secondary" className="text-[10px]">INEP {s.inep_code}</Badge>}
                {(s.shifts ?? []).map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            </div>
          </Card>
        ))}
        <LoadMore hasMore={page.hasMore} onMore={page.loadMore} />
      </div>
    </MobileShell>
  );
}
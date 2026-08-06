/** Filtro hierárquico Secretaria→Regional→Distrito→Escola. */
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNetworkSchools, useOrgTree } from "@/hooks/use-org";
import { ORG_UNIT_LABEL } from "@/domain/org/types";
import { schoolsInUnit, scopedSchoolIds } from "@/domain/org/scope";

export type OrgScope = { unitId: string | null; schoolId: string | null };

export const EMPTY_SCOPE: OrgScope = { unitId: null, schoolId: null };

export function useOrgScope(scope: OrgScope) {
  const units = useOrgTree();
  const schools = useNetworkSchools();
  const unitList = units.data ?? [];
  const schoolList = schools.data ?? [];
  return {
    units: unitList,
    schools: schoolList,
    visibleSchools: schoolsInUnit(unitList, schoolList, scope.unitId),
    allowedSchoolIds: scopedSchoolIds(unitList, schoolList, scope),
    isLoading: units.isLoading || schools.isLoading,
  };
}

export function OrgScopeFilter({
  value,
  onChange,
}: {
  value: OrgScope;
  onChange: (next: OrgScope) => void;
}) {
  const { units, visibleSchools } = useOrgScope(value);
  if (units.length === 0 && visibleSchools.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select
        value={value.unitId ?? "all"}
        onValueChange={(v) => onChange({ unitId: v === "all" ? null : v, schoolId: null })}
      >
        <SelectTrigger className="h-10 rounded-xl bg-secondary/50 border-transparent text-xs">
          <SelectValue placeholder="Unidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda a rede</SelectItem>
          {units.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {"— ".repeat(u.depth)}
              {ORG_UNIT_LABEL[u.type]}: {u.short_name || u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.schoolId ?? "all"}
        onValueChange={(v) => onChange({ ...value, schoolId: v === "all" ? null : v })}
      >
        <SelectTrigger className="h-10 rounded-xl bg-secondary/50 border-transparent text-xs">
          <SelectValue placeholder="Escola" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as escolas</SelectItem>
          {visibleSchools.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
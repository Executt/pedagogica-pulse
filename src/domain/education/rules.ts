/**
 * Camada de DOMÍNIO — regras puras reutilizáveis por qualquer interface.
 */
import type { RiskLevel, SchoolClass, Student, StudentSummary } from "./types";

export function classHeadcount(turma: Pick<SchoolClass, "students">): number {
  return turma.students?.length ?? 0;
}

export function countHighRisk(students: Pick<StudentSummary, "risk">[]): number {
  return (students ?? []).filter((s) => s.risk === "high").length;
}

export function riskDistribution(
  students: Pick<StudentSummary, "risk">[],
): Record<RiskLevel, number> {
  const base: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const s of students ?? []) base[s.risk] = (base[s.risk] ?? 0) + 1;
  return base;
}

export function averageAttendance(students: Pick<Student, "attendance_rate">[]): number {
  const list = students ?? [];
  if (list.length === 0) return 0;
  const sum = list.reduce((acc, s) => acc + (Number(s.attendance_rate) || 0), 0);
  return Math.round(sum / list.length);
}
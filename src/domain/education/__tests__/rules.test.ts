import { describe, it, expect } from "vitest";
import { averageAttendance, classHeadcount, countHighRisk, riskDistribution } from "@/domain/education/rules";

describe("regras de domínio — educação", () => {
  const students = [
    { id: "1", risk: "high" as const, attendance_rate: 80 },
    { id: "2", risk: "low" as const, attendance_rate: 100 },
    { id: "3", risk: "medium" as const, attendance_rate: 90 },
    { id: "4", risk: "high" as const, attendance_rate: 70 },
  ];

  it("conta alunos da turma", () => {
    expect(classHeadcount({ students })).toBe(4);
    expect(classHeadcount({ students: [] })).toBe(0);
  });

  it("conta alunos em risco alto", () => {
    expect(countHighRisk(students)).toBe(2);
  });

  it("distribui por nível de risco", () => {
    expect(riskDistribution(students)).toEqual({ low: 1, medium: 1, high: 2 });
  });

  it("calcula frequência média arredondada", () => {
    expect(averageAttendance(students)).toBe(85);
    expect(averageAttendance([])).toBe(0);
  });
});

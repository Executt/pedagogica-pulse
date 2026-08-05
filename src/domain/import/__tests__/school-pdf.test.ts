import { describe, expect, it } from "vitest";
import { isValidCnpj, parseSchoolsFromText } from "../school-pdf";

const SAMPLE = `
SECRETARIA MUNICIPAL DE EDUCACAO
REGIONAL NORTE
EMEF Professora Ana Lima
Rua das Acacias, 120 - Centro
INEP 12345678 CNPJ 11.222.333/0001-81 CEP 60000-000
Turnos: matutino e vespertino - Ensino Fundamental
Capacidade: 480
EMEI Girassol
Av. Brasil, 900
INEP 87654321
Educacao Infantil - integral
DISTRITO 3
EMEF Professora Ana Lima
INEP 12345678
`;

describe("importador de PDF de escolas", () => {
  const result = parseSchoolsFromText(SAMPLE);

  it("identifica as escolas do documento", () => {
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates[0].name).toContain("Ana Lima");
  });

  it("extrai campos estruturados", () => {
    const c = result.candidates[0];
    expect(c.inep_code).toBe("12345678");
    expect(c.cnpj).toBe("11222333000181");
    expect(c.postal_code).toBe("60000000");
    expect(c.capacity).toBe(480);
    expect(c.shifts).toContain("matutino");
    expect(c.modalities).toContain("ensino_fundamental");
  });

  it("associa a unidade organizacional da secao", () => {
    expect(result.candidates[0].orgUnitName).toBe("REGIONAL NORTE");
    expect(result.candidates[2].orgUnitType).toBe("distrito");
  });

  it("marca duplicidade de INEP como erro bloqueante", () => {
    const dup = result.candidates[2];
    expect(dup.issues.some((i) => i.field === "inep_code" && i.severity === "erro")).toBe(true);
    expect(result.stats.duplicates).toBeGreaterThan(0);
  });

  it("gera aviso quando faltam endereco ou INEP", () => {
    expect(result.candidates[1].issues.some((i) => i.severity === "aviso")).toBe(true);
  });

  it("valida CNPJ pelos digitos verificadores", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-99")).toBe(false);
  });
});
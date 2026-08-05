/**
 * DOMÍNIO — Importador inteligente do PDF oficial de escolas.
 * Funções puras: recebem TEXTO já extraído do PDF e devolvem candidatos
 * normalizados + inconsistências para revisão manual. Sem I/O.
 */
import type { OrgUnitType } from "@/domain/org/types";

export type Severity = "erro" | "aviso";

export type Inconsistency = {
  field: string;
  message: string;
  severity: Severity;
};

export type SchoolCandidate = {
  /** Índice estável na ordem de leitura do PDF. */
  key: string;
  name: string;
  inep_code: string | null;
  cnpj: string | null;
  address: string | null;
  district: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  capacity: number | null;
  shifts: string[];
  modalities: string[];
  /** Unidade organizacional inferida do cabeçalho de seção do PDF. */
  orgUnitName: string | null;
  orgUnitType: OrgUnitType | null;
  rawLines: string[];
  issues: Inconsistency[];
};

export type ParseResult = {
  candidates: SchoolCandidate[];
  /** Unidades organizacionais detectadas nos cabeçalhos de seção. */
  orgUnits: { name: string; type: OrgUnitType }[];
  stats: { lines: number; withErrors: number; withWarnings: number; duplicates: number };
};

const SCHOOL_PREFIX =
  /^(EMEF|EMEI|EMEIF|EEF|EE|CEI|CMEI|CRECHE|ESCOLA|COLEGIO|COLÉGIO|CENTRO EDUCACIONAL|UNIDADE ESCOLAR)\b/i;
const RE_INEP = /\b(\d{8})\b/;
const RE_CNPJ = /\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/;
const RE_CEP = /\b(\d{5}-?\d{3})\b/;
const RE_PHONE = /\(?\b(\d{2})\)?\s?(9?\d{4})-?(\d{4})\b/;
const RE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const RE_CAPACITY = /\b(?:capacidade|vagas)\s*:?\s*(\d{2,5})\b/i;
const RE_SECTION =
  /^(SECRETARIA|SUBSECRETARIA|REGIONAL|DIRETORIA REGIONAL|DISTRITO|DRE)\b[\s:–-]*(.*)$/i;

const SHIFT_WORDS: Record<string, string> = {
  matutino: "matutino",
  manha: "matutino",
  manhã: "matutino",
  vespertino: "vespertino",
  tarde: "vespertino",
  noturno: "noturno",
  noite: "noturno",
  integral: "integral",
};

const MODALITY_WORDS: Record<string, string> = {
  infantil: "educacao_infantil",
  fundamental: "ensino_fundamental",
  medio: "ensino_medio",
  médio: "ensino_medio",
  eja: "eja",
  especial: "educacao_especial",
};

export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Validação de CNPJ com dígitos verificadores. */
export function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = 0; i < len; i++) {
      sum += Number(d[i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

function sectionType(keyword: string): OrgUnitType {
  const k = normalizeName(keyword);
  if (k.startsWith("SUBSECRETARIA")) return "subsecretaria";
  if (k.startsWith("DISTRITO")) return "distrito";
  if (k.startsWith("SECRETARIA")) return "secretaria";
  return "regional";
}

function detectList(text: string, dict: Record<string, string>): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  Object.entries(dict).forEach(([word, value]) => {
    if (lower.includes(word)) found.add(value);
  });
  return [...found];
}

/** Agrupa as linhas do PDF em blocos, um por escola. */
function splitBlocks(lines: string[]) {
  const blocks: { section: { name: string; type: OrgUnitType } | null; lines: string[] }[] = [];
  let section: { name: string; type: OrgUnitType } | null = null;
  let current: string[] | null = null;

  const flush = () => {
    if (current && current.length) blocks.push({ section, lines: current });
    current = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;
    const sec = line.match(RE_SECTION);
    if (sec && !SCHOOL_PREFIX.test(line)) {
      flush();
      const label = (sec[2] || "").trim();
      section = {
        name: label ? `${sec[1]} ${label}`.trim() : sec[1],
        type: sectionType(sec[1]),
      };
      continue;
    }
    if (SCHOOL_PREFIX.test(line)) {
      flush();
      current = [line];
      continue;
    }
    if (current) current.push(line);
  }
  flush();
  return blocks;
}

export function parseSchoolsFromText(text: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const blocks = splitBlocks(lines);
  const orgUnits = new Map<string, OrgUnitType>();
  const candidates: SchoolCandidate[] = [];

  blocks.forEach((block, index) => {
    const joined = block.lines.join(" | ");
    const name = block.lines[0].replace(/\s*[|;]\s*$/, "").trim();

    if (block.section) orgUnits.set(block.section.name, block.section.type);

    const inep = joined.match(RE_INEP)?.[1] ?? null;
    const cnpjRaw = joined.match(RE_CNPJ)?.[1] ?? null;
    const cep = joined.match(RE_CEP)?.[1] ?? null;
    const phoneMatch = joined.match(RE_PHONE);
    const addressLine =
      block.lines.slice(1).find((l) => /\b(rua|av\.?|avenida|travessa|estrada|rodovia|praça|praca)\b/i.test(l)) ??
      null;

    candidates.push({
      key: `row-${index + 1}`,
      name,
      inep_code: inep,
      cnpj: cnpjRaw ? onlyDigits(cnpjRaw) : null,
      address: addressLine,
      district: null,
      postal_code: cep ? onlyDigits(cep) : null,
      phone: phoneMatch ? onlyDigits(phoneMatch[0]) : null,
      email: joined.match(RE_EMAIL)?.[0] ?? null,
      capacity: joined.match(RE_CAPACITY) ? Number(joined.match(RE_CAPACITY)![1]) : null,
      shifts: detectList(joined, SHIFT_WORDS),
      modalities: detectList(joined, MODALITY_WORDS),
      orgUnitName: block.section?.name ?? null,
      orgUnitType: block.section?.type ?? null,
      rawLines: block.lines,
      issues: [],
    });
  });

  // Deduplicação por INEP e por nome normalizado
  const seenInep = new Map<string, string>();
  const seenName = new Map<string, string>();
  let duplicates = 0;

  candidates.forEach((c) => {
    const issues: Inconsistency[] = [];

    if (!c.name || c.name.length < 5)
      issues.push({ field: "name", message: "Nome da escola ausente ou muito curto.", severity: "erro" });

    if (!c.inep_code)
      issues.push({ field: "inep_code", message: "Código INEP não encontrado no bloco.", severity: "aviso" });

    if (c.cnpj && !isValidCnpj(c.cnpj))
      issues.push({ field: "cnpj", message: "CNPJ com dígito verificador inválido.", severity: "erro" });

    if (!c.orgUnitName)
      issues.push({ field: "org_unit", message: "Sem regional/distrito identificado no PDF.", severity: "aviso" });

    if (!c.address)
      issues.push({ field: "address", message: "Endereço não identificado.", severity: "aviso" });

    if (c.capacity !== null && (c.capacity < 10 || c.capacity > 5000))
      issues.push({ field: "capacity", message: "Capacidade fora da faixa esperada (10–5000).", severity: "aviso" });

    if (c.inep_code) {
      const prev = seenInep.get(c.inep_code);
      if (prev) {
        duplicates++;
        issues.push({ field: "inep_code", message: `INEP duplicado (também em ${prev}).`, severity: "erro" });
      } else seenInep.set(c.inep_code, c.key);
    }

    const nk = normalizeName(c.name);
    const prevName = seenName.get(nk);
    if (prevName) {
      duplicates++;
      issues.push({ field: "name", message: `Nome duplicado (também em ${prevName}).`, severity: "aviso" });
    } else seenName.set(nk, c.key);

    c.issues = issues;
  });

  return {
    candidates,
    orgUnits: [...orgUnits.entries()].map(([name, type]) => ({ name, type })),
    stats: {
      lines: lines.length,
      withErrors: candidates.filter((c) => c.issues.some((i) => i.severity === "erro")).length,
      withWarnings: candidates.filter(
        (c) => c.issues.length > 0 && !c.issues.some((i) => i.severity === "erro"),
      ).length,
      duplicates,
    },
  };
}

export function isImportable(c: SchoolCandidate): boolean {
  return !c.issues.some((i) => i.severity === "erro");
}
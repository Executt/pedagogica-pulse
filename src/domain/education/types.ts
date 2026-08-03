/**
 * Camada de DOMÍNIO — Contexto delimitado "Educação".
 *
 * Regra: este arquivo NÃO pode importar React, Supabase, TanStack ou qualquer
 * detalhe de infraestrutura. Apenas tipos e regras puras de negócio.
 */

export type RiskLevel = "low" | "medium" | "high";

export type StudentSummary = {
  id: string;
  full_name?: string;
  risk: RiskLevel;
  attendance_rate?: number | null;
};

export type SchoolClass = {
  id: string;
  name: string;
  grade: string;
  year: number;
  students: StudentSummary[];
};

export type Skill = { label: string; value: number };

export type Observation = {
  id: string;
  content: string;
  type: string;
  created_at: string;
  author?: string | null;
};

export type Student = {
  id: string;
  full_name: string;
  class_id: string | null;
  class_name?: string | null;
  grade?: string | null;
  risk: RiskLevel;
  attendance_rate: number;
  has_pei: boolean;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  birth_date?: string | null;
  skills?: Skill[];
};

export type ClassDetail = {
  turma: SchoolClass | null;
  students: Student[];
  materials: unknown[];
  events: unknown[];
};

export type StudentDetail = {
  student: (Student & { classes?: { name?: string; grade?: string } | null }) | null;
  observations: Observation[];
  suggestions: unknown[];
};
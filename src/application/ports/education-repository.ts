/**
 * Camada de APLICAÇÃO — Ports (interfaces de repositório).
 *
 * Os casos de uso dependem apenas destas interfaces. As implementações
 * concretas (Supabase, Mock, futuros conectores) vivem em `src/infrastructure`.
 */
import type { ClassDetail, SchoolClass, StudentDetail } from "@/domain/education/types";

export interface ClassRepository {
  list(): Promise<SchoolClass[]>;
  getDetail(classId: string): Promise<ClassDetail>;
}

export interface StudentRepository {
  getDetail(studentId: string): Promise<StudentDetail>;
}

export interface EducationRepositories {
  classes: ClassRepository;
  students: StudentRepository;
}

/** Origem dos dados resolvida pelo composition root. */
export type DataSourceKind = "supabase" | "mock";
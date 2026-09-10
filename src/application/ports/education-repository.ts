/**
 * Camada de APLICAÇÃO — Ports (interfaces de repositório).
 *
 * Os casos de uso dependem apenas destas interfaces. As implementações
 * concretas (Supabase, Mock, futuros conectores) vivem em `src/infrastructure`.
 */
import type {
  ClassDetail,
  SchoolClass,
  SchoolDashboard,
  Student,
  StudentDetail,
} from "@/domain/education/types";

export interface ClassRepository {
  list(): Promise<SchoolClass[]>;
  getDetail(classId: string): Promise<ClassDetail>;
}

export interface StudentRepository {
  list(): Promise<Student[]>;
  getDetail(studentId: string): Promise<StudentDetail>;
}

export interface SchoolDashboardRepository {
  getDashboard(schoolId: string): Promise<SchoolDashboard>;
}

export interface EducationRepositories {
  classes: ClassRepository;
  students: StudentRepository;
  schools: SchoolDashboardRepository;
}

/**
 * Origem dos dados resolvida pelo composition root.
 * - `pulse`: sistema Inteligência Pedagógica (fonte oficial do app)
 * - `supabase`: base local de apoio (registros enviados pelo app)
 * - `mock`: cenário de demonstração
 */
export type DataSourceKind = "pulse" | "supabase" | "mock";
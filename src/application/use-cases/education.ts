/**
 * Camada de APLICAÇÃO — Casos de uso do contexto "Educação".
 * Recebem os ports por injeção; não conhecem Supabase nem React.
 */
import type { EducationRepositories } from "@/application/ports/education-repository";
import type { ClassDetail, SchoolClass, Student, StudentDetail } from "@/domain/education/types";

export function listClasses(repos: EducationRepositories): Promise<SchoolClass[]> {
  return repos.classes.list();
}

export function getClassDetail(repos: EducationRepositories, classId: string): Promise<ClassDetail> {
  return repos.classes.getDetail(classId);
}

export function getStudentDetail(
  repos: EducationRepositories,
  studentId: string,
): Promise<StudentDetail> {
  return repos.students.getDetail(studentId);
}

export function listStudents(repos: EducationRepositories): Promise<Student[]> {
  return repos.students.list();
}
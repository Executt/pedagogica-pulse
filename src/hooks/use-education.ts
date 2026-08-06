/**
 * Camada de INTERFACE — hooks que ligam a UI aos casos de uso.
 * Nenhum componente deve chamar Supabase ou mock-mode diretamente.
 */
import { useSmartQuery } from "@/hooks/use-smart-query";
import { educationRepositories } from "@/infrastructure/container";
import {
  getClassDetail,
  getStudentDetail,
  listClasses,
  listStudents,
} from "@/application/use-cases/education";
import type { ClassDetail, SchoolClass, Student, StudentDetail } from "@/domain/education/types";

const api = educationRepositories("supabase");
const mock = educationRepositories("mock");

export function useClasses() {
  return useSmartQuery<SchoolClass[]>({
    queryKey: ["classes"],
    apiFn: () => listClasses(api),
    mockFn: () => listClasses(mock),
  });
}

export function useClassDetail(classId: string) {
  return useSmartQuery<ClassDetail>({
    queryKey: ["class", classId],
    apiFn: () => getClassDetail(api, classId),
    mockFn: () => getClassDetail(mock, classId),
  });
}

export function useStudentDetail(studentId: string) {
  return useSmartQuery<StudentDetail>({
    queryKey: ["student", studentId],
    apiFn: () => getStudentDetail(api, studentId),
    mockFn: () => getStudentDetail(mock, studentId),
  });
}

export function useStudents() {
  return useSmartQuery<Student[]>({
    queryKey: ["students"],
    apiFn: () => listStudents(api),
    mockFn: () => listStudents(mock),
  });
}
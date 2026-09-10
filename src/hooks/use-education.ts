/**
 * Camada de INTERFACE — hooks que ligam a UI aos casos de uso.
 * Nenhum componente deve chamar Supabase ou mock-mode diretamente.
 *
 * Leitura: sistema Inteligência Pedagógica primeiro; base local de apoio
 * como contingência; cenário demo como último recurso (useSmartQuery).
 */
import { useSmartQuery } from "@/hooks/use-smart-query";
import { educationRepositories, remoteFirst } from "@/infrastructure/container";
import {
  getClassDetail,
  getSchoolDashboard,
  getStudentDetail,
  listClasses,
  listStudents,
} from "@/application/use-cases/education";
import type {
  ClassDetail,
  SchoolClass,
  SchoolDashboard,
  Student,
  StudentDetail,
} from "@/domain/education/types";

export function useSchoolDashboard(schoolId: string) {
  return useSmartQuery<SchoolDashboard>({
    queryKey: ["school-dashboard", schoolId],
    apiFn: remoteFirst((repos) => getSchoolDashboard(repos, schoolId)),
    mockFn: () => getSchoolDashboard(mock, schoolId),
    enabled: Boolean(schoolId),
  });
}

const mock = educationRepositories("mock");

export function useClasses() {
  return useSmartQuery<SchoolClass[]>({
    queryKey: ["classes"],
    apiFn: remoteFirst((repos) => listClasses(repos)),
    mockFn: () => listClasses(mock),
  });
}

export function useClassDetail(classId: string) {
  return useSmartQuery<ClassDetail>({
    queryKey: ["class", classId],
    apiFn: remoteFirst((repos) => getClassDetail(repos, classId)),
    mockFn: () => getClassDetail(mock, classId),
  });
}

export function useStudentDetail(studentId: string) {
  return useSmartQuery<StudentDetail>({
    queryKey: ["student", studentId],
    apiFn: remoteFirst((repos) => getStudentDetail(repos, studentId)),
    mockFn: () => getStudentDetail(mock, studentId),
  });
}

export function useStudents() {
  return useSmartQuery<Student[]>({
    queryKey: ["students"],
    apiFn: remoteFirst((repos) => listStudents(repos)),
    mockFn: () => listStudents(mock),
  });
}

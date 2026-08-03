/**
 * Camada de INFRAESTRUTURA — implementação Mock dos ports de Educação.
 * Substitui o consumo direto de `mock-mode` pelas telas.
 */
import { getMockData, getMockClassDetail, getMockStudentDetail } from "@/lib/mock-mode";
import type {
  ClassRepository,
  EducationRepositories,
  StudentRepository,
} from "@/application/ports/education-repository";
import type { ClassDetail, SchoolClass, StudentDetail } from "@/domain/education/types";

const EMPTY_CLASS: ClassDetail = { turma: null, students: [], materials: [], events: [] };
const EMPTY_STUDENT: StudentDetail = { student: null, observations: [], suggestions: [] };

const classRepository: ClassRepository = {
  async list(): Promise<SchoolClass[]> {
    return getMockData().classes as unknown as SchoolClass[];
  },
  async getDetail(classId: string): Promise<ClassDetail> {
    return (getMockClassDetail(classId) as unknown as ClassDetail) ?? EMPTY_CLASS;
  },
};

const studentRepository: StudentRepository = {
  async getDetail(studentId: string): Promise<StudentDetail> {
    return (getMockStudentDetail(studentId) as unknown as StudentDetail) ?? EMPTY_STUDENT;
  },
};

export const mockEducationRepositories: EducationRepositories = {
  classes: classRepository,
  students: studentRepository,
};
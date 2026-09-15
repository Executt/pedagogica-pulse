/**
 * Camada de INFRAESTRUTURA — implementação Mock dos ports de Educação.
 * Substitui o consumo direto de `mock-mode` pelas telas.
 */
import { getMockData, getMockClassDetail, getMockStudentDetail } from "@/lib/mock-mode";
import type {
  ClassRepository,
  EducationRepositories,
  SchoolDashboardRepository,
  StudentRepository,
} from "@/application/ports/education-repository";
import type {
  ClassDetail,
  Observation,
  SchoolClass,
  SchoolDashboard,
  Student,
  StudentDetail,
} from "@/domain/education/types";

const EMPTY_CLASS: ClassDetail = {
  turma: null, students: [], materials: [], events: [], observations: [], suggestions: [],
};
const EMPTY_STUDENT: StudentDetail = {
  student: null, observations: [], suggestions: [], materials: [],
};

const classRepository: ClassRepository = {
  async list(): Promise<SchoolClass[]> {
    return getMockData().classes as unknown as SchoolClass[];
  },
  async getDetail(classId: string): Promise<ClassDetail> {
    return (getMockClassDetail(classId) as unknown as ClassDetail) ?? EMPTY_CLASS;
  },
};

const studentRepository: StudentRepository = {
  async list(): Promise<Student[]> {
    return getMockData().students as unknown as Student[];
  },
  async getDetail(studentId: string): Promise<StudentDetail> {
    return (getMockStudentDetail(studentId) as unknown as StudentDetail) ?? EMPTY_STUDENT;
  },
};

const schoolRepository: SchoolDashboardRepository = {
  async getDashboard(): Promise<SchoolDashboard> {
    const d = getMockData();
    const students = d.students as unknown as Student[];
    const observations = d.students.flatMap((s) =>
      s.observations.map((o) => ({
        id: o.id,
        content: o.content,
        type: o.type,
        created_at: o.created_at,
        author: `${o.author} · ${s.full_name}`,
      })),
    ) as Observation[];
    return {
      classes: d.classes as unknown as SchoolClass[],
      students,
      materials: d.materials,
      observations: observations
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 20),
      suggestions: d.suggestions,
      events: d.events,
    };
  },
};

export const mockEducationRepositories: EducationRepositories = {
  classes: classRepository,
  students: studentRepository,
  schools: schoolRepository,
};
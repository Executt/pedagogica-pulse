/**
 * Camada de INFRAESTRUTURA — implementação "Pulse" dos ports de Educação.
 *
 * Esta é a fonte primária do aplicativo: o app não tem banco próprio,
 * ele lê os dados reais do sistema Inteligência Pedagógica através das
 * rotas públicas assinadas (Bearer + HMAC-SHA256).
 *
 * Se o sistema remoto ainda não expõe a rota de leitura (404), lançamos
 * um erro para que a camada superior (useSmartQuery) caia no fallback.
 */
import { fetchPulseResource } from "@/lib/pulse-read.functions";
import type {
  ClassRepository,
  EducationRepositories,
  SchoolDashboardRepository,
  StudentRepository,
} from "@/application/ports/education-repository";
import type {
  ClassDetail,
  Observation,
  SchoolDashboard,
  RiskLevel,
  SchoolClass,
  Student,
  StudentDetail,
} from "@/domain/education/types";

type Row = Record<string, unknown>;
type Resource = "escolas" | "turmas" | "alunos" | "registros" | "observacoes" | "agenda" | "sugestoes";

export class PulseReadUnavailableError extends Error {
  constructor(resource: string, reason: string | null) {
    super(`Leitura Pulse indisponível para "${resource}": ${reason ?? "rota inexistente"}`);
    this.name = "PulseReadUnavailableError";
  }
}

async function read(
  resource: Resource,
  params: { classId?: string; studentId?: string; schoolId?: string; limit?: number } = {},
) {
  const res = await fetchPulseResource({
    data: {
      resource,
      ...(params.schoolId ? { schoolId: params.schoolId } : {}),
      ...(params.classId ? { classId: params.classId } : {}),
      ...(params.studentId ? { studentId: params.studentId } : {}),
      limit: params.limit ?? 200,
    },
  });
  if (!res.ok) throw new PulseReadUnavailableError(resource, res.error);
  return JSON.parse(res.itemsJson) as Row[];
}

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const nullableStr = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" ? v : fallback);

function toRisk(v: unknown): RiskLevel {
  return v === "high" || v === "medium" || v === "low" ? v : "low";
}

function toStudent(row: Row): Student {
  return {
    id: str(row["id"]),
    full_name: str(row["full_name"]),
    class_id: nullableStr(row["class_id"]),
    class_name: nullableStr(row["class_name"]),
    grade: nullableStr(row["grade"]),
    school_id: nullableStr(row["school_id"]),
    risk: toRisk(row["risk"]),
    attendance_rate: num(row["attendance_rate"], 0),
    has_pei: row["has_pei"] === true,
    guardian_name: nullableStr(row["guardian_name"]),
    guardian_phone: nullableStr(row["guardian_phone"]),
    birth_date: nullableStr(row["birth_date"]) ?? nullableStr(row["birthdate"]),
  };
}

function toClass(row: Row, students: Student[]): SchoolClass {
  const id = str(row["id"]);
  return {
    id,
    name: str(row["name"]),
    grade: str(row["grade"]),
    year: num(row["year"], new Date().getFullYear()),
    school_id: nullableStr(row["school_id"]),
    students: students
      .filter((s) => s.class_id === id)
      .map((s) => ({
        id: s.id,
        full_name: s.full_name,
        risk: s.risk,
        attendance_rate: s.attendance_rate,
      })),
  };
}

function toObservation(row: Row): Observation {
  return {
    id: str(row["id"]),
    content: str(row["content"]),
    type: str(row["type"]) || "geral",
    created_at: str(row["created_at"]),
    author: nullableStr(row["author"]),
  };
}

const classRepository: ClassRepository = {
  async list(): Promise<SchoolClass[]> {
    const [turmas, alunos] = await Promise.all([read("turmas"), read("alunos")]);
    const students = alunos.map(toStudent);
    return turmas.map((t) => toClass(t, students));
  },

  async getDetail(classId: string): Promise<ClassDetail> {
    const [turmas, alunos, registros, agenda] = await Promise.all([
      read("turmas"),
      read("alunos", { classId }),
      read("registros", { classId }).catch(() => [] as Row[]),
      read("agenda", { classId }).catch(() => [] as Row[]),
    ]);
    const students = alunos.map(toStudent).filter((s) => s.class_id === classId || !s.class_id);
    const turmaRow = turmas.find((t) => str(t["id"]) === classId) ?? null;
    return {
      turma: turmaRow ? toClass(turmaRow, students) : null,
      students,
      materials: registros,
      events: agenda,
    };
  },
};

const studentRepository: StudentRepository = {
  async list(): Promise<Student[]> {
    return (await read("alunos")).map(toStudent);
  },

  async getDetail(studentId: string): Promise<StudentDetail> {
    const [alunos, observacoes, sugestoes] = await Promise.all([
      read("alunos", { studentId }),
      read("observacoes", { studentId }).catch(() => [] as Row[]),
      read("sugestoes", { studentId }).catch(() => [] as Row[]),
    ]);
    const row = alunos.find((a) => str(a["id"]) === studentId) ?? alunos[0];
    const student = row ? toStudent(row) : null;
    return {
      student: student
        ? { ...student, classes: { name: student.class_name ?? undefined, grade: student.grade ?? undefined } }
        : null,
      observations: observacoes.map(toObservation),
      suggestions: sugestoes,
    };
  },
};

const schoolRepository: SchoolDashboardRepository = {
  async getDashboard(schoolId: string): Promise<SchoolDashboard> {
    const [turmas, alunos, registros, observacoes, sugestoes, agenda] = await Promise.all([
      read("turmas", { schoolId }),
      read("alunos", { schoolId }),
      read("registros", { schoolId }).catch(() => [] as Row[]),
      read("observacoes", { schoolId }).catch(() => [] as Row[]),
      read("sugestoes", { schoolId }).catch(() => [] as Row[]),
      read("agenda", { schoolId }).catch(() => [] as Row[]),
    ]);
    const belongs = (row: Row) => !row["school_id"] || str(row["school_id"]) === schoolId;
    const students = alunos.filter(belongs).map(toStudent);
    return {
      classes: turmas.filter(belongs).map((t) => toClass(t, students)),
      students,
      materials: registros.filter(belongs),
      observations: observacoes.map(toObservation),
      suggestions: sugestoes.filter(belongs),
      events: agenda.filter(belongs),
    };
  },
};

export const pulseEducationRepositories: EducationRepositories = {
  classes: classRepository,
  students: studentRepository,
  schools: schoolRepository,
};

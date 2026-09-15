/**
 * Camada de INFRAESTRUTURA — implementação Supabase dos ports de Educação.
 */
import { supabase } from "@/integrations/supabase/client";
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

const classRepository: ClassRepository = {
  async list(): Promise<SchoolClass[]> {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, grade, year, school_id, students(id, risk)")
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as SchoolClass[];
  },

  async getDetail(classId: string): Promise<ClassDetail> {
    const [c, students, materials, events, suggestions] = await Promise.all([
      supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
      supabase.from("students").select("*").eq("class_id", classId).order("full_name"),
      supabase
        .from("materials")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false }),
      supabase.from("events").select("*").eq("class_id", classId).order("starts_at"),
      supabase
        .from("ai_suggestions")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const studentRows = (students.data ?? []) as unknown as Student[];
    const studentIds = studentRows.map((s) => s.id);
    const obsRes = studentIds.length
      ? await supabase
          .from("observations")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] as unknown[] };
    return {
      turma: (c.data ?? null) as unknown as SchoolClass | null,
      students: studentRows,
      materials: materials.data ?? [],
      events: events.data ?? [],
      observations: (obsRes.data ?? []) as unknown as Observation[],
      suggestions: suggestions.data ?? [],
    };
  },
};

const studentRepository: StudentRepository = {
  async list(): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*, classes(name, grade, school_id)")
      .order("full_name");
    if (error) throw error;
    return (data ?? []).map((s) => {
      const row = s as unknown as Student & {
        classes?: { name?: string; grade?: string; school_id?: string | null } | null;
      };
      return {
        ...row,
        class_name: row.classes?.name ?? null,
        grade: row.classes?.grade ?? null,
        school_id: row.classes?.school_id ?? null,
      } as Student;
    });
  },

  async getDetail(studentId: string): Promise<StudentDetail> {
    const [s, obs, sug, mat] = await Promise.all([
      supabase.from("students").select("*, classes(name, grade)").eq("id", studentId).maybeSingle(),
      supabase
        .from("observations")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("ai_suggestions")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
    ]);
    return {
      student: (s.data ?? null) as unknown as StudentDetail["student"],
      observations: (obs.data ?? []) as unknown as StudentDetail["observations"],
      suggestions: sug.data ?? [],
    };
  },
};

const schoolRepository: SchoolDashboardRepository = {
  async getDashboard(schoolId: string): Promise<SchoolDashboard> {
    const [classesRes, materialsRes, suggestionsRes, eventsRes] = await Promise.all([
      supabase.from("classes").select("*").eq("school_id", schoolId).order("name"),
      supabase
        .from("materials")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("ai_suggestions")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("events").select("*").eq("school_id", schoolId).order("starts_at").limit(50),
    ]);

    const classRows = (classesRes.data ?? []) as unknown as SchoolClass[];
    const classIds = classRows.map((c) => c.id);
    const studentsRes = classIds.length
      ? await supabase.from("students").select("*").in("class_id", classIds).order("full_name")
      : { data: [] as unknown[] };
    const students = ((studentsRes.data ?? []) as unknown as Student[]).map((s) => ({
      ...s,
      school_id: schoolId,
      class_name: classRows.find((c) => c.id === s.class_id)?.name ?? null,
    }));

    const studentIds = students.map((s) => s.id);
    const obsRes = studentIds.length
      ? await supabase
          .from("observations")
          .select("*")
          .in("student_id", studentIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] as unknown[] };

    return {
      classes: classRows.map((c) => ({
        ...c,
        students: students
          .filter((s) => s.class_id === c.id)
          .map((s) => ({
            id: s.id,
            full_name: s.full_name,
            risk: s.risk,
            attendance_rate: s.attendance_rate,
          })),
      })),
      students,
      materials: materialsRes.data ?? [],
      observations: (obsRes.data ?? []) as unknown as Observation[],
      suggestions: suggestionsRes.data ?? [],
      events: eventsRes.data ?? [],
    };
  },
};

export const supabaseEducationRepositories: EducationRepositories = {
  classes: classRepository,
  students: studentRepository,
  schools: schoolRepository,
};
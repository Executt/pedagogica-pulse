/**
 * Camada de INFRAESTRUTURA — implementação Supabase dos ports de Educação.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  ClassRepository,
  EducationRepositories,
  StudentRepository,
} from "@/application/ports/education-repository";
import type { ClassDetail, SchoolClass, Student, StudentDetail } from "@/domain/education/types";

const classRepository: ClassRepository = {
  async list(): Promise<SchoolClass[]> {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name, grade, year, students(id, risk)")
      .order("name");
    if (error) throw error;
    return (data ?? []) as unknown as SchoolClass[];
  },

  async getDetail(classId: string): Promise<ClassDetail> {
    const [c, students, materials, events] = await Promise.all([
      supabase.from("classes").select("*").eq("id", classId).maybeSingle(),
      supabase.from("students").select("*").eq("class_id", classId).order("full_name"),
      supabase
        .from("materials")
        .select("*")
        .eq("class_id", classId)
        .order("created_at", { ascending: false }),
      supabase.from("events").select("*").eq("class_id", classId).order("starts_at"),
    ]);
    return {
      turma: (c.data ?? null) as unknown as SchoolClass | null,
      students: (students.data ?? []) as unknown as Student[],
      materials: materials.data ?? [],
      events: events.data ?? [],
    };
  },
};

const studentRepository: StudentRepository = {
  async getDetail(studentId: string): Promise<StudentDetail> {
    const [s, obs, sug] = await Promise.all([
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

export const supabaseEducationRepositories: EducationRepositories = {
  classes: classRepository,
  students: studentRepository,
};
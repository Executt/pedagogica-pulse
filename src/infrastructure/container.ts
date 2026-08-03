/**
 * Composition root — resolve qual implementação dos ports será usada.
 * Única peça que conhece, ao mesmo tempo, Supabase e Mock.
 */
import type { DataSourceKind, EducationRepositories } from "@/application/ports/education-repository";
import { supabaseEducationRepositories } from "@/infrastructure/supabase/education.repository";
import { mockEducationRepositories } from "@/infrastructure/mock/education.repository";

export function educationRepositories(source: DataSourceKind): EducationRepositories {
  return source === "mock" ? mockEducationRepositories : supabaseEducationRepositories;
}

export const repositories = {
  education: educationRepositories,
};
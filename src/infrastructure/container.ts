/**
 * Composition root — resolve qual implementação dos ports será usada.
 *
 * O app não possui base de dados própria para os dados pedagógicos:
 * a fonte oficial é o sistema Inteligência Pedagógica (adaptador `pulse`).
 * `supabase` permanece como base local de apoio (registros enviados pelo app)
 * e `mock` como cenário de demonstração/fallback.
 */
import type { DataSourceKind, EducationRepositories } from "@/application/ports/education-repository";
import { supabaseEducationRepositories } from "@/infrastructure/supabase/education.repository";
import { mockEducationRepositories } from "@/infrastructure/mock/education.repository";
import { pulseEducationRepositories } from "@/infrastructure/pulse/education.repository";

export function educationRepositories(source: DataSourceKind): EducationRepositories {
  if (source === "mock") return mockEducationRepositories;
  if (source === "supabase") return supabaseEducationRepositories;
  return pulseEducationRepositories;
}

/**
 * Estratégia de leitura do app: tenta o sistema remoto e, se a rota de
 * leitura ainda não existir lá, usa a base local de apoio. O fallback final
 * para o cenário demo é feito por `useSmartQuery`.
 */
export function remoteFirst<T>(
  call: (repos: EducationRepositories) => Promise<T>,
): () => Promise<T> {
  return async () => {
    try {
      return await call(pulseEducationRepositories);
    } catch (err) {
      console.warn("[pulse] leitura remota indisponível, usando base local:", err);
      return call(supabaseEducationRepositories);
    }
  };
}

export const repositories = {
  education: educationRepositories,
};

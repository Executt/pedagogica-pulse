import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useMockMode } from "@/lib/mock-mode";
import { recordFailure, recordSuccess, inCooldown } from "@/lib/api-health";

export type QuerySource = "mock" | "api" | "fallback";

/** Intervalo padrão de refetch em segundo plano (3 min). */
const DEFAULT_REFETCH_MS = 3 * 60_000;

/**
 * Query wrapper que:
 * - Se o "modo demo" está ligado, sempre retorna dados mockados.
 * - Se está desligado: tenta a API; em caso de erro registra a falha
 *   no circuit breaker e devolve o mock como `source: "fallback"`.
 * - Se o circuit breaker está em cooldown (N falhas seguidas), pula a
 *   API e devolve o mock direto.
 * - Refaz a chamada em segundo plano em `refetchIntervalMs` (default 3min)
 *   sem bloquear a navegação (usa `refetchIntervalInBackground: false`).
 */
export function useSmartQuery<T>(opts: {
  queryKey: unknown[];
  apiFn: () => Promise<T>;
  mockFn: () => T;
  enabled?: boolean;
  refetchIntervalMs?: number;
  extra?: Omit<UseQueryOptions<{ data: T; source: QuerySource }>, "queryKey" | "queryFn">;
}): UseQueryResult<{ data: T; source: QuerySource }> & { isMock: boolean } {
  const mock = useMockMode();

  const q = useQuery({
    queryKey: [...opts.queryKey, { mock }],
    enabled: opts.enabled,
    retry: false,
    refetchInterval: mock ? false : (opts.refetchIntervalMs ?? DEFAULT_REFETCH_MS),
    refetchIntervalInBackground: false,
    queryFn: async () => {
      if (mock) return { data: opts.mockFn(), source: "mock" as const };
      if (inCooldown()) {
        return { data: opts.mockFn(), source: "fallback" as const };
      }
      try {
        const data = await opts.apiFn();
        recordSuccess();
        return { data, source: "api" as const };
      } catch (err) {
        recordFailure(err);
        console.warn("[smart-query] API failed, fallback to mock:", err);
        return { data: opts.mockFn(), source: "fallback" as const };
      }
    },
    ...(opts.extra ?? {}),
  });

  const source = q.data?.source;
  return Object.assign(q, { isMock: mock || source === "fallback" || source === "mock" });
}
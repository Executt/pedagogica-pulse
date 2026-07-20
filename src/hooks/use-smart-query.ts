import { useQuery, type UseQueryOptions, type UseQueryResult } from "@tanstack/react-query";
import { useMockMode } from "@/lib/mock-mode";

/**
 * Query wrapper que:
 * - Se o "modo demo" está ligado, sempre retorna dados mockados (sem chamar API).
 * - Se está desligado, tenta a API e, em caso de erro, faz fallback para o mock.
 * Também expõe `source` ("mock" | "api") no `meta`, útil para UI.
 */
export function useSmartQuery<T>(opts: {
  queryKey: unknown[];
  apiFn: () => Promise<T>;
  mockFn: () => T;
  enabled?: boolean;
  extra?: Omit<UseQueryOptions<{ data: T; source: "mock" | "api" }>, "queryKey" | "queryFn">;
}): UseQueryResult<{ data: T; source: "mock" | "api" }> & { isMock: boolean } {
  const mock = useMockMode();

  const q = useQuery({
    queryKey: [...opts.queryKey, { mock }],
    enabled: opts.enabled,
    retry: mock ? false : 1,
    queryFn: async () => {
      if (mock) return { data: opts.mockFn(), source: "mock" as const };
      try {
        const data = await opts.apiFn();
        return { data, source: "api" as const };
      } catch (err) {
        // Fallback para mock, mas mantém a mensagem para o botão de retry
        console.warn("[smart-query] API failed, fallback to mock:", err);
        throw err;
      }
    },
    ...(opts.extra ?? {}),
  });

  return Object.assign(q, { isMock: mock || q.isError });
}
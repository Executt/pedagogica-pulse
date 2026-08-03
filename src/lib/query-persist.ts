import type { QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const KEY = "ip-query-cache";
/** Cache local válido por 24h — evita refazer chamadas após o 1º carregamento. */
const MAX_AGE = 24 * 60 * 60 * 1000;

let started = false;

/** Restaura/persiste o cache do React Query no localStorage (somente browser). */
export function startQueryPersistence(queryClient: QueryClient) {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    persistQueryClient({
      // Duas cópias de @tanstack/query-core podem coexistir no lockfile;
      // o cast evita conflito nominal de tipos entre elas.
      queryClient: queryClient as unknown as Parameters<typeof persistQueryClient>[0]["queryClient"],
      maxAge: MAX_AGE,
      buster: "v1",
      persister: createSyncStoragePersister({ storage: window.localStorage, key: KEY, throttleTime: 1000 }),
      dehydrateOptions: {
        // Não persistimos erros nem queries de diagnóstico/logs.
        shouldDehydrateQuery: (q) =>
          q.state.status === "success" && !String(q.queryKey[0] ?? "").startsWith("pulse-logs"),
      },
    });
  } catch {
    /* localStorage indisponível (modo privado) */
  }
}

export function clearPersistedQueries() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

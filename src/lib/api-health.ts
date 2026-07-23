import { useSyncExternalStore } from "react";

/**
 * Circuit breaker + status tracker para chamadas à API.
 * - `record(ok)` registra sucesso/falha.
 * - Após N falhas consecutivas dentro de uma janela, entra em modo
 *   "cooldown" e as queries devolvem mock imediatamente sem tentar API,
 *   até o cooldown expirar.
 */

const FAIL_THRESHOLD = 3;
const COOLDOWN_MS = 5 * 60_000; // 5 min
const EVT = "ip-api-health-changed";

export type ApiStatus = "ok" | "degraded" | "cooldown" | "unknown";

type State = {
  consecutiveFailures: number;
  lastError: string | null;
  cooldownUntil: number; // epoch ms; 0 = no cooldown
  lastSuccessAt: number;
};

let state: State = {
  consecutiveFailures: 0,
  lastError: null,
  cooldownUntil: 0,
  lastSuccessAt: 0,
};

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVT));
  }
}

export function recordSuccess() {
  state = {
    consecutiveFailures: 0,
    lastError: null,
    cooldownUntil: 0,
    lastSuccessAt: Date.now(),
  };
  emit();
}

export function recordFailure(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  const next = state.consecutiveFailures + 1;
  state = {
    ...state,
    consecutiveFailures: next,
    lastError: msg,
    cooldownUntil: next >= FAIL_THRESHOLD ? Date.now() + COOLDOWN_MS : state.cooldownUntil,
  };
  emit();
}

export function inCooldown(): boolean {
  return state.cooldownUntil > Date.now();
}

export function resetHealth() {
  state = { consecutiveFailures: 0, lastError: null, cooldownUntil: 0, lastSuccessAt: 0 };
  emit();
}

export function getApiStatus(mockMode: boolean): ApiStatus {
  if (mockMode) return "unknown";
  if (inCooldown()) return "cooldown";
  if (state.consecutiveFailures > 0) return "degraded";
  if (state.lastSuccessAt > 0) return "ok";
  return "unknown";
}

export function getHealthSnapshot() {
  return state;
}

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVT, cb);
  return () => window.removeEventListener(EVT, cb);
}

export function useApiHealth() {
  return useSyncExternalStore(subscribe, getHealthSnapshot, getHealthSnapshot);
}

// Test-only helpers
export const __testing = {
  setState: (s: Partial<State>) => {
    state = { ...state, ...s };
    emit();
  },
  FAIL_THRESHOLD,
  COOLDOWN_MS,
};
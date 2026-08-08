/**
 * DOMÍNIO — Rascunho de decisões da revisão de importação.
 * Mantém a seleção de escolas, as rejeições campo a campo e o
 * histórico de alterações (com desfazer). Funções puras.
 */

export type DraftState = {
  /** Chaves das escolas aceitas para importação. */
  selected: string[];
  /** Campos rejeitados por escola: { [key]: ["inep_code", ...] } */
  rejectedFields: Record<string, string[]>;
};

export type DraftEntry = {
  label: string;
  at: string;
  /** Estado anterior à ação — permite desfazer. */
  before: DraftState;
};

export type Draft = { state: DraftState; history: DraftEntry[] };

const HISTORY_LIMIT = 50;

export function createDraft(selected: string[] = []): Draft {
  return { state: { selected: [...selected], rejectedFields: {} }, history: [] };
}

/** Aplica uma transformação registrando o estado anterior no histórico. */
export function applyDraft(
  draft: Draft,
  label: string,
  fn: (state: DraftState) => DraftState,
  now: Date = new Date(),
): Draft {
  const next = fn(draft.state);
  const entry: DraftEntry = { label, at: now.toISOString(), before: draft.state };
  return { state: next, history: [entry, ...draft.history].slice(0, HISTORY_LIMIT) };
}

/** Desfaz a última ação; sem histórico, devolve o mesmo rascunho. */
export function undoDraft(draft: Draft): Draft {
  const [last, ...rest] = draft.history;
  if (!last) return draft;
  return { state: last.before, history: rest };
}

export function canUndo(draft: Draft): boolean {
  return draft.history.length > 0;
}

export function isSelected(state: DraftState, key: string): boolean {
  return state.selected.includes(key);
}

export function toggleSelection(state: DraftState, key: string): DraftState {
  const selected = isSelected(state, key)
    ? state.selected.filter((k) => k !== key)
    : [...state.selected, key];
  return { ...state, selected };
}

export function bulkSelect(state: DraftState, keys: string[], accept: boolean): DraftState {
  const set = new Set(state.selected);
  keys.forEach((k) => (accept ? set.add(k) : set.delete(k)));
  return { ...state, selected: [...set] };
}

export function isFieldRejected(state: DraftState, key: string, field: string): boolean {
  return (state.rejectedFields[key] ?? []).includes(field);
}

/** Aceita (remove da lista) ou rejeita (adiciona) um campo específico da escola. */
export function setFieldDecision(
  state: DraftState,
  key: string,
  field: string,
  accept: boolean,
): DraftState {
  const current = state.rejectedFields[key] ?? [];
  const next = accept ? current.filter((f) => f !== field) : [...new Set([...current, field])];
  const rejectedFields = { ...state.rejectedFields };
  if (next.length === 0) delete rejectedFields[key];
  else rejectedFields[key] = next;
  return { ...state, rejectedFields };
}

export function rejectedCount(state: DraftState): number {
  return Object.values(state.rejectedFields).reduce((sum, f) => sum + f.length, 0);
}
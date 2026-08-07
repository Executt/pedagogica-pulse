/**
 * DOMÍNIO — Serialização CSV do histórico de importações.
 * Funções puras (sem DOM, sem I/O), testáveis isoladamente.
 */
import type { ImportRunRecord } from "@/application/ports/org-repository";

const HEADER = [
  "data",
  "usuario_id",
  "arquivo",
  "detectadas",
  "criadas",
  "atualizadas",
  "bloqueadas",
  "unidades",
  "inconsistencias_total",
  "inconsistencia_escola",
  "inconsistencia_campo",
  "inconsistencia_severidade",
  "inconsistencia_mensagem",
];

/** Escapa um valor para CSV RFC 4180 (delimitador ponto e vírgula, padrão pt-BR). */
export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvLine(cells: unknown[]): string {
  return cells.map(csvCell).join(";");
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("pt-BR");
}

/**
 * Uma linha por inconsistência; execuções sem inconsistência geram uma linha
 * de resumo com os campos de detalhe vazios.
 */
export function importRunsToCsv(runs: ImportRunRecord[]): string {
  const rows: string[] = [csvLine(HEADER)];

  runs.forEach((run) => {
    const base = [
      formatDate(run.created_at),
      run.user_id,
      run.file_name,
      run.total_detected,
      run.inserted_count,
      run.updated_count,
      run.skipped_count,
      run.units_count,
      run.issues.length,
    ];
    if (run.issues.length === 0) {
      rows.push(csvLine([...base, "", "", "", ""]));
      return;
    }
    run.issues.forEach((i) => {
      rows.push(csvLine([...base, i.school, i.field, i.severity, i.message]));
    });
  });

  // BOM para o Excel reconhecer acentuação UTF-8.
  return "\uFEFF" + rows.join("\r\n");
}

export function importRunsCsvFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `importacoes-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.csv`;
}

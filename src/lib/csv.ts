/** Coluna exportável: chave do objeto + rótulo no cabeçalho. */
export interface CsvColumn<T> {
  key: keyof T;
  label: string;
}

function escapeCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // Aspas duplicadas e envolve em aspas se houver separador/quebra/aspas.
  if (/[";\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 * Gera CSV (delimitador `;`, amigável ao Excel pt-BR) a partir de linhas.
 */
export function toCSV<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(";");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.key])).join(";"))
    .join("\r\n");
  return `${header}\r\n${body}`;
}

/**
 * Dispara o download de um CSV no navegador (com BOM para acentuação correta).
 */
export function downloadCSV<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
): void {
  const csv = toCSV(rows, columns);
  const blob = new Blob([`﻿${csv}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

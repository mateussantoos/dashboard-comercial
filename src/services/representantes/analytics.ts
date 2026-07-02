import type { VendaAno } from "./types";

export interface ResumoKpi {
  /** Soma de todo o período disponível. */
  totalPeriodo: number;
  qtdTotal: number;
  ticketMedio: number;
  /** Ano mais recente presente nos dados. */
  ultimoAno: number | null;
  totalUltimoAno: number;
  /** Ano imediatamente anterior (para o comparativo). */
  anoAnterior: number | null;
  /** Variação % do último ano sobre o anterior (pode ser parcial). */
  deltaYoY: number | null;
  melhorAno: number | null;
  melhorAnoTotal: number;
}

/** Consolida os indicadores do representante a partir das vendas anuais. */
export function resumoRepresentante(ano: VendaAno[]): ResumoKpi {
  const ordenado = [...ano].sort((a, b) => a.ano - b.ano);

  const totalPeriodo = ordenado.reduce((s, a) => s + a.total, 0);
  const qtdTotal = ordenado.reduce((s, a) => s + a.qtd, 0);
  const ticketMedio = qtdTotal ? totalPeriodo / qtdTotal : 0;

  const ultimo = ordenado[ordenado.length - 1] ?? null;
  const anterior = ordenado[ordenado.length - 2] ?? null;

  const deltaYoY =
    ultimo && anterior && anterior.total
      ? (ultimo.total / anterior.total - 1) * 100
      : null;

  const melhor = ordenado.reduce<VendaAno | null>(
    (best, a) => (!best || a.total > best.total ? a : best),
    null
  );

  return {
    totalPeriodo,
    qtdTotal,
    ticketMedio,
    ultimoAno: ultimo?.ano ?? null,
    totalUltimoAno: ultimo?.total ?? 0,
    anoAnterior: anterior?.ano ?? null,
    deltaYoY,
    melhorAno: melhor?.ano ?? null,
    melhorAnoTotal: melhor?.total ?? 0,
  };
}

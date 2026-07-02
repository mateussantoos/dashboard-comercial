/**
 * Tipo de movimento usado como base de cálculo das vendas.
 * - "V": Faturamento (Nota de venda confirmada) — padrão.
 * - "P": Pedido de venda.
 */
export type TipMov = "V" | "P";

/** Representante (vendedor) ativo — cadastro TGFVEN. */
export interface Representante {
  codvend: number;
  nome: string;
}

/** Total faturado/pedido de um representante em um ano. */
export interface VendaAno {
  ano: number;
  total: number;
  qtd: number;
}

/** Total de um representante quebrado por ano e mês (sazonalidade). */
export interface VendaAnoMes {
  ano: number;
  mes: number;
  total: number;
  qtd: number;
}

/** Total de um representante agrupado por UF (estado). */
export interface VendaUF {
  uf: string;
  total: number;
  qtd: number;
}

/** Linha de ranking (top clientes / top produtos). */
export interface TopItem {
  codigo: number;
  nome: string;
  total: number;
  qtd: number;
}

/** Ponto do comparativo entre vários representantes (por ano). */
export interface ComparativoPonto {
  codvend: number;
  ano: number;
  total: number;
}

/** Opções comuns de filtro das consultas. */
export interface FiltroVendas {
  tipmov: TipMov;
  /** Janela de anos para a visão Ano × Mês. Default: 4. */
  anos?: number;
}

// --- Visão gerencial (tela inicial) ---

/** Período do recorte "por ano" da visão gerencial. */
export type PeriodoSnapshot = "ontem" | "hoje" | "mes" | "ano";

/** Linha do recorte por ano (Ontem/Hoje/Mês/Ano). */
export interface SnapshotAno {
  ano: number;
  vendas: number;
  pedidos: number;
  /** Variação % de vendas sobre o ano anterior. */
  pctVend: number | null;
}

/**
 * Linha comparativa ano anterior × ano atual, usada por UF, Representantes
 * e Mensal.
 */
export interface LinhaComparativa {
  rotulo: string;
  /** Código (quando aplicável, ex.: CODVEND). */
  codigo?: number;
  /** Ordem de exibição (ex.: número do mês). */
  ordem?: number;
  vendAnt: number;
  pedAnt: number;
  vendAtu: number;
  pedAtu: number;
  /** Variação % de vendas (atual sobre anterior). */
  pctVend: number | null;
}

/** Anos base do comparativo gerencial. */
export interface AnosComparativo {
  anoAtual: number;
  anoAnterior: number;
}

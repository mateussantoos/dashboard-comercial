const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** Formata como moeda: R$ 1.234,56 */
export function formatBRL(value: number): string {
  return brl.format(Number.isFinite(value) ? value : 0);
}

/** Formata compacto para eixos/legendas: R$ 1,2 mi */
export function formatBRLCompact(value: number): string {
  return brlCompact.format(Number.isFinite(value) ? value : 0);
}

/** Formata número inteiro com separador de milhar: 1.234 */
export function formatInt(value: number): string {
  return inteiro.format(Number.isFinite(value) ? Math.round(value) : 0);
}

/** Formata percentual já em pontos percentuais: 12,3% */
export function formatPct(value: number, digits = 1): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v.toFixed(digits).replace(".", ",")}%`;
}

/** Formata percentual com sinal explícito: +12,3% / -4,0% */
export function formatSignedPct(value: number, digits = 1): string {
  const v = Number.isFinite(value) ? value : 0;
  const sinal = v > 0 ? "+" : "";
  return `${sinal}${formatPct(v, digits)}`;
}

/** Nomes de meses (pt-BR) — índice 0 vazio para acesso por número (1..12). */
export const MESES_PT = [
  "",
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export function nomeMes(mes: number): string {
  return MESES_PT[mes] ?? String(mes);
}

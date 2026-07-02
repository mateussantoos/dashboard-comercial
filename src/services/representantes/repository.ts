import { sankhyaService } from "@/services/sankhya";

import * as Q from "./queries";
import * as M from "./mock";
import type {
  ComparativoPonto,
  LinhaComparativa,
  PeriodoSnapshot,
  Representante,
  SnapshotAno,
  TipMov,
  TopItem,
  VendaAno,
  VendaAnoMes,
  VendaUF,
} from "./types";

const MESES_COMPLETOS = [
  "",
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pct(atual: number, anterior: number): number | null {
  return anterior ? (atual / anterior - 1) * 100 : null;
}

/**
 * Usa dados mock apenas em desenvolvimento fora do Sankhya (quando o runtime
 * nativo `window.executeQuery` não existe). Dentro do Sankhya — e em qualquer
 * build de produção — sempre executa as queries reais.
 */
function useMock(): boolean {
  return import.meta.env.DEV && typeof window.executeQuery !== "function";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function run(query: Q.Query): Promise<Record<string, unknown>[]> {
  return sankhyaService.executeQuery(query.sql, query.params);
}

export async function getRepresentantes(): Promise<Representante[]> {
  if (useMock()) {
    await delay(200);
    return M.mockRepresentantes();
  }
  const rows = await run(Q.listRepresentantes());
  return rows.map((r) => ({
    codvend: toNumber(r.CODVEND),
    nome: String(r.NOME ?? "").trim(),
  }));
}

export async function getVendasAno(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): Promise<VendaAno[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasAno(codvend, tipmov, meses);
  }
  const rows = await run(Q.vendasPorAno(codvend, tipmov, meses));
  return rows.map((r) => ({
    ano: toNumber(r.ANO),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

export async function getVendasAnoMes(
  codvend: number,
  tipmov: TipMov,
  anos = 4,
  meses?: number[]
): Promise<VendaAnoMes[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasAnoMes(codvend, tipmov, anos, meses);
  }
  const rows = await run(Q.vendasAnoMes(codvend, tipmov, anos, meses));
  return rows.map((r) => ({
    ano: toNumber(r.ANO),
    mes: toNumber(r.MES),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

export async function getVendasUF(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): Promise<VendaUF[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasUF(codvend, tipmov, meses);
  }
  const rows = await run(Q.vendasPorUF(codvend, tipmov, meses));
  return rows.map((r) => ({
    uf: String(r.UF ?? "").trim(),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

export async function getTopClientes(
  codvend: number,
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): Promise<TopItem[]> {
  if (useMock()) {
    await delay(300);
    return M.mockTopClientes(codvend, tipmov, limite, meses);
  }
  const rows = await run(Q.topClientes(codvend, tipmov, limite, meses));
  return rows.map(mapTopItem);
}

export async function getTopProdutos(
  codvend: number,
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): Promise<TopItem[]> {
  if (useMock()) {
    await delay(300);
    return M.mockTopProdutos(codvend, tipmov, limite, meses);
  }
  const rows = await run(Q.topProdutos(codvend, tipmov, limite, meses));
  return rows.map(mapTopItem);
}

export async function getComparativo(
  codvends: number[],
  tipmov: TipMov
): Promise<ComparativoPonto[]> {
  if (useMock()) {
    await delay(300);
    return M.mockComparativo(codvends, tipmov);
  }
  if (!codvends.length) return [];
  const rows = await run(Q.comparativoRepresentantes(codvends, tipmov));
  return rows.map((r) => ({
    codvend: toNumber(r.CODVEND),
    ano: toNumber(r.ANO),
    total: toNumber(r.TOTAL),
  }));
}

function mapTopItem(r: Record<string, unknown>): TopItem {
  return {
    codigo: toNumber(r.CODIGO),
    nome: String(r.NOME ?? "").trim(),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  };
}

// --- Visão gerencial (tela inicial) ---

export async function getSnapshotAno(
  periodo: PeriodoSnapshot,
  meses?: number[]
): Promise<SnapshotAno[]> {
  if (useMock()) {
    await delay(250);
    return M.mockSnapshotAno(periodo, meses);
  }
  const rows = await run(Q.snapshotPorAno(periodo, meses));
  const linhas = rows
    .map((r) => ({
      ano: toNumber(r.ANO),
      vendas: toNumber(r.VENDAS),
      pedidos: toNumber(r.PEDIDOS),
    }))
    .sort((a, b) => b.ano - a.ano);

  return linhas.map((l, i) => ({
    ...l,
    pctVend: linhas[i + 1] ? pct(l.vendas, linhas[i + 1].vendas) : null,
  }));
}

function mapComparativa(
  r: Record<string, unknown>,
  rotulo: string,
  extra?: Partial<LinhaComparativa>
): LinhaComparativa {
  const vendAnt = toNumber(r.VEND_ANT);
  const vendAtu = toNumber(r.VEND_ATU);
  return {
    rotulo,
    vendAnt,
    pedAnt: toNumber(r.PED_ANT),
    vendAtu,
    pedAtu: toNumber(r.PED_ATU),
    pctVend: pct(vendAtu, vendAnt),
    ...extra,
  };
}

export async function getComparativoUF(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Promise<LinhaComparativa[]> {
  if (useMock()) {
    await delay(250);
    return M.mockComparativoUF(anoAtual, anoAnterior, meses);
  }
  const rows = await run(Q.comparativoUF(anoAtual, anoAnterior, meses));
  return rows.map((r) => mapComparativa(r, String(r.ROTULO ?? "").trim()));
}

export async function getComparativoRepresentantesGerencial(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Promise<LinhaComparativa[]> {
  if (useMock()) {
    await delay(250);
    return M.mockComparativoRepresentantes(anoAtual, anoAnterior, meses);
  }
  const rows = await run(
    Q.comparativoRepresentantesGerencial(anoAtual, anoAnterior, meses)
  );
  return rows.map((r) =>
    mapComparativa(r, String(r.ROTULO ?? "").trim(), {
      codigo: toNumber(r.CODIGO),
    })
  );
}

export async function getComparativoMensal(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Promise<LinhaComparativa[]> {
  if (useMock()) {
    await delay(250);
    return M.mockComparativoMensal(anoAtual, anoAnterior, meses);
  }
  const rows = await run(Q.comparativoMensal(anoAtual, anoAnterior, meses));
  return rows.map((r) => {
    const mes = toNumber(r.MES);
    return mapComparativa(r, MESES_COMPLETOS[mes] ?? String(mes), {
      ordem: mes,
    });
  });
}

import { sankhyaService } from "@/services/sankhya";

import * as Q from "./queries";
import * as M from "./mock";
import type {
  ComparativoPonto,
  DrillContexto,
  LinhaComparativa,
  PeriodoSnapshot,
  RegistroDetalhe,
  Representante,
  SnapshotAno,
  TipMov,
  TopItem,
  VendaAno,
  VendaAnoMes,
  VendaDia,
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

/**
 * Executa uma consulta com nova tentativa automática. A primeira execução de
 * uma consulta "fria" no Sankhya pode estourar o tempo limite; a segunda,
 * com o plano já em cache, costuma responder rápido — foi o que antes exigia
 * navegar entre telas para "forçar" o recarregamento.
 */
async function run(
  query: Q.Query,
  tentativas = 2
): Promise<Record<string, unknown>[]> {
  let ultimoErro: unknown;
  for (let i = 0; i < tentativas; i++) {
    try {
      return await sankhyaService.executeQuery(query.sql, query.params);
    } catch (e) {
      ultimoErro = e;
      if (i < tentativas - 1) await delay(600);
    }
  }
  throw ultimoErro;
}

export async function getRepresentantes(): Promise<Representante[]> {
  let brutos: { codvend: number; nome: string }[];
  if (useMock()) {
    await delay(200);
    brutos = M.mockRepresentantes();
  } else {
    const rows = await run(Q.listRepresentantes());
    brutos = rows.map((r) => ({
      codvend: toNumber(r.CODVEND),
      nome: String(r.NOME ?? "").trim(),
    }));
  }
  return mesclarRepresentantes(brutos);
}

/**
 * Mescla vendedores de mesmo nome (duplicidade de cadastro, ex.: dois "Robson")
 * em um único representante. `codvend` fica com o código canônico (menor) e
 * `codvends` reúne todos os códigos do grupo — consultados juntos nas telas.
 */
function mesclarRepresentantes(
  brutos: { codvend: number; nome: string }[]
): Representante[] {
  const grupos = new Map<string, { nome: string; codvends: number[] }>();
  for (const b of brutos) {
    const nome = b.nome.trim();
    if (!nome) continue;
    const chave = nome.toUpperCase();
    const g = grupos.get(chave) ?? { nome, codvends: [] };
    if (!g.codvends.includes(b.codvend)) g.codvends.push(b.codvend);
    grupos.set(chave, g);
  }
  return [...grupos.values()]
    .map((g) => ({
      codvend: Math.min(...g.codvends),
      nome: g.nome,
      codvends: [...g.codvends].sort((a, b) => a - b),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getVendasAno(
  codvends: number[],
  tipmov: TipMov,
  meses?: number[]
): Promise<VendaAno[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasAno(codvends, tipmov, meses);
  }
  const rows = await run(Q.vendasPorAno(codvends, meses));
  return rows.map((r) => ({
    ano: toNumber(r.ANO),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

/** Totais YTD (até a data de hoje) do ano atual e anterior de um representante. */
export async function getResumoAteData(
  codvends: number[],
  anoAtual: number,
  anoAnterior: number
): Promise<VendaAno[]> {
  if (useMock()) {
    await delay(250);
    return M.mockResumoAteData(codvends, anoAtual, anoAnterior);
  }
  const rows = await run(Q.resumoAteData(codvends, anoAtual, anoAnterior));
  return rows.map((r) => ({
    ano: toNumber(r.ANO),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

/** Vendas dia a dia (até a data de hoje) do ano atual e anterior. */
export async function getVendasPorDia(
  codvends: number[],
  anoAtual: number,
  anoAnterior: number
): Promise<VendaDia[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasPorDia(codvends, anoAtual, anoAnterior);
  }
  const rows = await run(Q.vendasPorDia(codvends, anoAtual, anoAnterior));
  return rows.map((r) => ({
    ano: toNumber(r.ANO),
    mes: toNumber(r.MES),
    dia: toNumber(r.DIA),
    total: toNumber(r.TOTAL),
  }));
}

export async function getVendasAnoMes(
  codvends: number[],
  tipmov: TipMov,
  anos = 4,
  meses?: number[]
): Promise<VendaAnoMes[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasAnoMes(codvends, tipmov, anos, meses);
  }
  const rows = await run(Q.vendasAnoMes(codvends, anos, meses));
  return rows.map((r) => ({
    ano: toNumber(r.ANO),
    mes: toNumber(r.MES),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

export async function getVendasUF(
  codvends: number[],
  tipmov: TipMov,
  meses?: number[]
): Promise<VendaUF[]> {
  if (useMock()) {
    await delay(300);
    return M.mockVendasUF(codvends, tipmov, meses);
  }
  const rows = await run(Q.vendasPorUF(codvends, meses));
  return rows.map((r) => ({
    uf: String(r.UF ?? "").trim(),
    total: toNumber(r.TOTAL),
    qtd: toNumber(r.QTD),
  }));
}

export async function getTopClientes(
  codvends: number[],
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): Promise<TopItem[]> {
  if (useMock()) {
    await delay(300);
    return M.mockTopClientes(codvends, tipmov, limite, meses);
  }
  const rows = await run(Q.topClientes(codvends, limite, meses));
  return rows.map(mapTopItem);
}

export async function getTopProdutos(
  codvends: number[],
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): Promise<TopItem[]> {
  if (useMock()) {
    await delay(300);
    return M.mockTopProdutos(codvends, tipmov, limite, meses);
  }
  const rows = await run(Q.topProdutos(codvends, limite, meses));
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
  const rows = await run(Q.comparativoRepresentantes(codvends));
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

  return linhas.map((l, i) => {
    const anterior = linhas[i + 1];
    return {
      ...l,
      pctVend: anterior ? pct(l.vendas, anterior.vendas) : null,
      pctQtd: anterior ? pct(l.pedidos, anterior.pedidos) : null,
    };
  });
}

function mapComparativa(
  r: Record<string, unknown>,
  rotulo: string,
  extra?: Partial<LinhaComparativa>
): LinhaComparativa {
  const vendAnt = toNumber(r.VEND_ANT);
  const vendAtu = toNumber(r.VEND_ATU);
  const pedAnt = toNumber(r.PED_ANT);
  const pedAtu = toNumber(r.PED_ATU);
  return {
    rotulo,
    vendAnt,
    pedAnt,
    vendAtu,
    pedAtu,
    pctVend: pct(vendAtu, vendAnt),
    pctPed: pct(pedAtu, pedAnt),
    ...extra,
  };
}

/** Numera as linhas (já ordenadas por valor) com sua posição no ranking. */
function comRanking(linhas: LinhaComparativa[]): LinhaComparativa[] {
  return linhas.map((l, i) => ({ ...l, rk: i + 1 }));
}

/**
 * Mescla linhas de mesmo rótulo (nomes de representante duplicados, ex.: dois
 * "Robson"), somando os valores e reunindo os códigos em `codvends`. Reordena
 * por vendas do ano atual.
 */
function mesclarComparativaPorNome(
  linhas: LinhaComparativa[]
): LinhaComparativa[] {
  const grupos = new Map<string, LinhaComparativa>();
  for (const l of linhas) {
    const chave = l.rotulo.trim().toUpperCase();
    const g = grupos.get(chave);
    if (!g) {
      grupos.set(chave, {
        ...l,
        codvends: l.codigo != null ? [l.codigo] : [],
      });
    } else {
      g.vendAnt += l.vendAnt;
      g.pedAnt += l.pedAnt;
      g.vendAtu += l.vendAtu;
      g.pedAtu += l.pedAtu;
      if (l.codigo != null) g.codvends = [...(g.codvends ?? []), l.codigo];
    }
  }
  return [...grupos.values()]
    .map((g) => ({
      ...g,
      pctVend: pct(g.vendAtu, g.vendAnt),
      pctPed: pct(g.pedAtu, g.pedAnt),
    }))
    .sort((a, b) => b.vendAtu - a.vendAtu);
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
  return comRanking(
    rows.map((r) => mapComparativa(r, String(r.ROTULO ?? "").trim()))
  );
}

export async function getComparativoRepresentantesGerencial(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Promise<LinhaComparativa[]> {
  let linhas: LinhaComparativa[];
  if (useMock()) {
    await delay(250);
    linhas = M.mockComparativoRepresentantes(anoAtual, anoAnterior, meses);
  } else {
    const rows = await run(
      Q.comparativoRepresentantesGerencial(anoAtual, anoAnterior, meses)
    );
    linhas = rows.map((r) =>
      mapComparativa(r, String(r.ROTULO ?? "").trim(), {
        codigo: toNumber(r.CODIGO),
      })
    );
  }
  // Nomes duplicados (ex.: dois "Robson") viram uma linha só.
  return comRanking(mesclarComparativaPorNome(linhas));
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

// --- Drill-down: registros que compõem um dado agregado ---

/** Tamanho da página e teto de segurança do drill-down paginado. */
const PAGINA_DETALHE = 5000;
const MAX_DETALHE = 100000;

function mapRegistro(r: Record<string, unknown>): RegistroDetalhe {
  return {
    id: toNumber(r.NUNOTA) || String(r.NUNOTA ?? ""),
    descricao: String(r.CLIENTE ?? "").trim(),
    valor: toNumber(r.VALOR),
    periodo: String(r.DATA ?? "").trim(),
    extra:
      String(r.VENDEDOR ?? "").trim() || String(r.UF ?? "").trim() || undefined,
  };
}

export async function getRegistrosDetalhe(
  ctx: DrillContexto
): Promise<RegistroDetalhe[]> {
  if (useMock()) {
    await delay(280);
    return M.mockRegistrosDetalhe(ctx);
  }
  // Pagina via OFFSET/FETCH até esgotar (o Sankhya limita ~5000 linhas/consulta).
  const registros: RegistroDetalhe[] = [];
  for (let offset = 0; offset < MAX_DETALHE; offset += PAGINA_DETALHE) {
    const rows = await run(Q.registrosDetalhe(ctx, offset, PAGINA_DETALHE));
    registros.push(...rows.map(mapRegistro));
    if (rows.length < PAGINA_DETALHE) break;
  }
  return registros;
}

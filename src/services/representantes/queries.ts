import type { SankhyaQueryParam } from "@/types/global";
import type { PeriodoSnapshot, TipMov } from "./types";

/** Uma consulta SQL pronta com seus parâmetros tipados (padrão do boilerplate). */
export interface Query {
  sql: string;
  params: SankhyaQueryParam[];
}

/**
 * Filtro base comum a todas as consultas de venda:
 * tipo de movimento (V/P), somente notas confirmadas (STATUSNOTA='L')
 * e o representante selecionado.
 */
const WHERE_BASE =
  "CAB.TIPMOV = ? AND CAB.STATUSNOTA = 'L' AND CAB.CODVEND = ?";

function baseParams(tipmov: TipMov, codvend: number): SankhyaQueryParam[] {
  return [
    { value: tipmov, type: "S" },
    { value: codvend, type: "I" },
  ];
}

/**
 * Filtro opcional de meses (`MONTH(DTNEG) IN (...)`). Vazio ou 12 meses = sem
 * filtro. Os números são validados como inteiros e interpolados com segurança.
 */
function filtroMeses(meses?: number[]): string {
  if (!meses || meses.length === 0 || meses.length >= 12) return "";
  const lista = meses
    .map((m) => Math.trunc(Number(m)))
    .filter((m) => m >= 1 && m <= 12);
  if (!lista.length || lista.length >= 12) return "";
  return `AND MONTH(CAB.DTNEG) IN (${lista.join(", ")})`;
}

/** Lista de representantes ativos para o seletor. */
export function listRepresentantes(): Query {
  return {
    sql: `
      SELECT CODVEND, RTRIM(APELIDO) AS NOME
      FROM TGFVEN
      WHERE ATIVO = 'S'
      ORDER BY APELIDO
    `,
    params: [],
  };
}

/** Total faturado por ano (gráfico anual). */
export function vendasPorAno(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT YEAR(CAB.DTNEG) AS ANO,
             SUM(CAB.VLRNOTA) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      WHERE ${WHERE_BASE}
        ${filtroMeses(meses)}
      GROUP BY YEAR(CAB.DTNEG)
      ORDER BY ANO
    `,
    params: baseParams(tipmov, codvend),
  };
}

/** Total por ano e mês, limitado aos últimos N anos (sazonalidade). */
export function vendasAnoMes(
  codvend: number,
  tipmov: TipMov,
  anos = 4,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT YEAR(CAB.DTNEG) AS ANO,
             MONTH(CAB.DTNEG) AS MES,
             SUM(CAB.VLRNOTA) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      WHERE ${WHERE_BASE}
        AND CAB.DTNEG >= DATEADD(YEAR, ?, GETDATE())
        ${filtroMeses(meses)}
      GROUP BY YEAR(CAB.DTNEG), MONTH(CAB.DTNEG)
      ORDER BY ANO, MES
    `,
    params: [...baseParams(tipmov, codvend), { value: -Math.abs(anos), type: "I" }],
  };
}

/** Total por UF (estado) do representante. */
export function vendasPorUF(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT UF.UF AS UF,
             SUM(CAB.VLRNOTA) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
      INNER JOIN TSICID CID ON CID.CODCID = PAR.CODCID
      INNER JOIN TSIUFS UF ON UF.CODUF = CID.UF
      WHERE ${WHERE_BASE}
        ${filtroMeses(meses)}
      GROUP BY UF.UF
      ORDER BY TOTAL DESC
    `,
    params: baseParams(tipmov, codvend),
  };
}

/** Ranking de clientes do representante (por valor). */
export function topClientes(
  codvend: number,
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): Query {
  const top = Math.max(1, Math.trunc(limite));
  return {
    sql: `
      SELECT TOP ${top}
             PAR.CODPARC AS CODIGO,
             RTRIM(PAR.NOMEPARC) AS NOME,
             SUM(CAB.VLRNOTA) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
      WHERE ${WHERE_BASE}
        ${filtroMeses(meses)}
      GROUP BY PAR.CODPARC, PAR.NOMEPARC
      ORDER BY TOTAL DESC
    `,
    params: baseParams(tipmov, codvend),
  };
}

/** Ranking de produtos vendidos pelo representante (nível item da nota). */
export function topProdutos(
  codvend: number,
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): Query {
  const top = Math.max(1, Math.trunc(limite));
  return {
    sql: `
      SELECT TOP ${top}
             PRO.CODPROD AS CODIGO,
             RTRIM(PRO.DESCRPROD) AS NOME,
             SUM(ITE.VLRTOT) AS TOTAL,
             SUM(ITE.QTDNEG) AS QTD
      FROM TGFCAB CAB
      INNER JOIN TGFITE ITE ON ITE.NUNOTA = CAB.NUNOTA
      INNER JOIN TGFPRO PRO ON PRO.CODPROD = ITE.CODPROD
      WHERE ${WHERE_BASE}
        ${filtroMeses(meses)}
      GROUP BY PRO.CODPROD, PRO.DESCRPROD
      ORDER BY TOTAL DESC
    `,
    params: baseParams(tipmov, codvend),
  };
}

/**
 * Totais por ano de vários representantes (comparativo).
 * Os códigos são validados como inteiros e interpolados na cláusula IN
 * (evita depender de bind de lista, mantendo a segurança).
 */
export function comparativoRepresentantes(
  codvends: number[],
  tipmov: TipMov
): Query {
  const lista = codvends
    .map((c) => Math.trunc(Number(c)))
    .filter((c) => Number.isFinite(c) && c > 0);

  const inClause = lista.length ? lista.join(", ") : "-1";

  return {
    sql: `
      SELECT CAB.CODVEND AS CODVEND,
             YEAR(CAB.DTNEG) AS ANO,
             SUM(CAB.VLRNOTA) AS TOTAL
      FROM TGFCAB CAB
      WHERE CAB.TIPMOV = ?
        AND CAB.STATUSNOTA = 'L'
        AND CAB.CODVEND IN (${inClause})
      GROUP BY CAB.CODVEND, YEAR(CAB.DTNEG)
      ORDER BY ANO
    `,
    params: [{ value: tipmov, type: "S" }],
  };
}

// --- Visão gerencial (tela inicial) ---

/** Filtro de período (sobre DTNEG) para o recorte por ano. */
function filtroPeriodo(periodo: PeriodoSnapshot): string {
  switch (periodo) {
    case "hoje":
      return "AND DAY(CAB.DTNEG) = DAY(GETDATE()) AND MONTH(CAB.DTNEG) = MONTH(GETDATE())";
    case "ontem":
      return "AND DAY(CAB.DTNEG) = DAY(DATEADD(DAY, -1, GETDATE())) AND MONTH(CAB.DTNEG) = MONTH(DATEADD(DAY, -1, GETDATE()))";
    case "mes":
      return "AND MONTH(CAB.DTNEG) = MONTH(GETDATE())";
    default:
      return "";
  }
}

/** Faturamento e nº de notas por ano, recortado por período (Ontem/Hoje/Mês/Ano). */
export function snapshotPorAno(
  periodo: PeriodoSnapshot,
  meses?: number[]
): Query {
  // O filtro de meses só faz sentido no recorte anual.
  const mesesSql = periodo === "ano" ? filtroMeses(meses) : "";
  return {
    sql: `
      SELECT YEAR(CAB.DTNEG) AS ANO,
             SUM(CAB.VLRNOTA) AS VENDAS,
             COUNT(CAB.NUNOTA) AS PEDIDOS
      FROM TGFCAB CAB
      WHERE CAB.TIPMOV = 'V'
        AND CAB.STATUSNOTA = 'L'
        ${filtroPeriodo(periodo)}
        ${mesesSql}
      GROUP BY YEAR(CAB.DTNEG)
      ORDER BY ANO DESC
    `,
    params: [],
  };
}

/** Parâmetros do comparativo ano anterior × atual (ordem: ANT, ANT, ATU, ATU, ATU, ANT). */
function paramsComparativo(
  anoAtual: number,
  anoAnterior: number
): SankhyaQueryParam[] {
  return [
    { value: anoAnterior, type: "I" },
    { value: anoAnterior, type: "I" },
    { value: anoAtual, type: "I" },
    { value: anoAtual, type: "I" },
    { value: anoAtual, type: "I" },
    { value: anoAnterior, type: "I" },
  ];
}

const SELECT_COMPARATIVO = `
  SUM(CASE WHEN YEAR(CAB.DTNEG) = ? THEN CAB.VLRNOTA ELSE 0 END) AS VEND_ANT,
  COUNT(CASE WHEN YEAR(CAB.DTNEG) = ? THEN CAB.NUNOTA END) AS PED_ANT,
  SUM(CASE WHEN YEAR(CAB.DTNEG) = ? THEN CAB.VLRNOTA ELSE 0 END) AS VEND_ATU,
  COUNT(CASE WHEN YEAR(CAB.DTNEG) = ? THEN CAB.NUNOTA END) AS PED_ATU`;

const WHERE_COMPARATIVO = `
  WHERE CAB.TIPMOV = 'V'
    AND CAB.STATUSNOTA = 'L'
    AND YEAR(CAB.DTNEG) IN (?, ?)`;

/** Comparativo de vendas por UF (ano anterior × atual). */
export function comparativoUF(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT UF.UF AS ROTULO,${SELECT_COMPARATIVO}
      FROM TGFCAB CAB
      INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
      INNER JOIN TSICID CID ON CID.CODCID = PAR.CODCID
      INNER JOIN TSIUFS UF ON UF.CODUF = CID.UF
      ${WHERE_COMPARATIVO}
        ${filtroMeses(meses)}
      GROUP BY UF.UF
      ORDER BY VEND_ATU DESC
    `,
    params: paramsComparativo(anoAtual, anoAnterior),
  };
}

/** Comparativo de vendas por representante (ano anterior × atual). */
export function comparativoRepresentantesGerencial(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT RTRIM(VEN.APELIDO) AS ROTULO,
             VEN.CODVEND AS CODIGO,${SELECT_COMPARATIVO}
      FROM TGFCAB CAB
      INNER JOIN TGFVEN VEN ON VEN.CODVEND = CAB.CODVEND
      ${WHERE_COMPARATIVO}
        ${filtroMeses(meses)}
      GROUP BY VEN.CODVEND, VEN.APELIDO
      ORDER BY VEND_ATU DESC
    `,
    params: paramsComparativo(anoAtual, anoAnterior),
  };
}

/** Comparativo de vendas por mês (ano anterior × atual). */
export function comparativoMensal(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT MONTH(CAB.DTNEG) AS MES,${SELECT_COMPARATIVO}
      FROM TGFCAB CAB
      ${WHERE_COMPARATIVO}
        ${filtroMeses(meses)}
      GROUP BY MONTH(CAB.DTNEG)
      ORDER BY MES
    `,
    params: paramsComparativo(anoAtual, anoAnterior),
  };
}

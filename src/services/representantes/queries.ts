import type { SankhyaQueryParam } from "@/types/global";
import type { DrillContexto, PeriodoSnapshot, TipMov } from "./types";

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
 * Filtro opcional de meses (`MONTH(DTNEG) IN (...)`).
 * - `undefined` ou 12 meses = sem filtro (todos os meses).
 * - `[]` (nenhum mês selecionado) = não retorna nada (`AND 1 = 0`).
 * Os números são validados como inteiros e interpolados com segurança.
 */
function filtroMeses(meses?: number[]): string {
  if (!meses || meses.length >= 12) return "";
  if (meses.length === 0) return "AND 1 = 0";
  const lista = meses
    .map((m) => Math.trunc(Number(m)))
    .filter((m) => m >= 1 && m <= 12);
  if (!lista.length) return "AND 1 = 0";
  if (lista.length >= 12) return "";
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

// --- Drill-down: notas que compõem um dado agregado ---

/**
 * Registros individuais (notas) que compõem o dado clicado. Aplica os filtros
 * da dimensão presente no contexto (ano, mês, UF, vendedor, cliente, produto).
 *
 * Paginado via `OFFSET/FETCH` para contornar o limite de linhas por consulta
 * do Sankhya (~5000): o repositório itera as páginas até esgotar os registros.
 */
export function registrosDetalhe(
  ctx: DrillContexto,
  offset = 0,
  limite = 5000
): Query {
  const off = Math.max(0, Math.trunc(offset));
  const lim = Math.max(1, Math.trunc(limite));
  const params: SankhyaQueryParam[] = [];
  let where = "CAB.TIPMOV = ? AND CAB.STATUSNOTA = 'L'";
  params.push({ value: ctx.tipmov, type: "S" });

  if (ctx.ano != null) {
    where += " AND YEAR(CAB.DTNEG) = ?";
    params.push({ value: ctx.ano, type: "I" });
  } else if (
    !ctx.todosAnos &&
    ctx.anoAtual != null &&
    ctx.anoAnterior != null
  ) {
    where += " AND YEAR(CAB.DTNEG) IN (?, ?)";
    params.push(
      { value: ctx.anoAtual, type: "I" },
      { value: ctx.anoAnterior, type: "I" }
    );
  }

  if (ctx.mes != null) {
    where += " AND MONTH(CAB.DTNEG) = ?";
    params.push({ value: ctx.mes, type: "I" });
  } else {
    const fm = filtroMeses(ctx.meses);
    if (fm) where += ` ${fm}`;
  }

  if (ctx.uf) {
    where += " AND UF.UF = ?";
    params.push({ value: ctx.uf, type: "S" });
  }
  if (ctx.codvend != null) {
    where += " AND CAB.CODVEND = ?";
    params.push({ value: ctx.codvend, type: "I" });
  }
  if (ctx.codparc != null) {
    where += " AND CAB.CODPARC = ?";
    params.push({ value: ctx.codparc, type: "I" });
  }
  if (ctx.codprod != null) {
    where +=
      " AND EXISTS (SELECT 1 FROM TGFITE ITE WHERE ITE.NUNOTA = CAB.NUNOTA AND ITE.CODPROD = ?)";
    params.push({ value: ctx.codprod, type: "I" });
  }

  return {
    sql: `
      SELECT CAB.NUNOTA AS NUNOTA,
             CONVERT(VARCHAR(10), CAB.DTNEG, 120) AS DATA,
             RTRIM(PAR.NOMEPARC) AS CLIENTE,
             RTRIM(VEN.APELIDO) AS VENDEDOR,
             UF.UF AS UF,
             CAB.VLRNOTA AS VALOR
      FROM TGFCAB CAB
      INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
      LEFT JOIN TGFVEN VEN ON VEN.CODVEND = CAB.CODVEND
      LEFT JOIN TSICID CID ON CID.CODCID = PAR.CODCID
      LEFT JOIN TSIUFS UF ON UF.CODUF = CID.UF
      WHERE ${where}
      ORDER BY CAB.DTNEG DESC
      OFFSET ${off} ROWS FETCH NEXT ${lim} ROWS ONLY
    `,
    params,
  };
}

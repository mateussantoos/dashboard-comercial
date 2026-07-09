import type { SankhyaQueryParam } from "@/types/global";
import type { DrillContexto, PeriodoSnapshot } from "./types";

/** Uma consulta SQL pronta com seus parâmetros tipados (padrão do boilerplate). */
export interface Query {
  sql: string;
  params: SankhyaQueryParam[];
}

/**
 * Filtro opcional de meses (`MONTH(<coluna>) IN (...)`).
 * - `undefined` ou 12 meses = sem filtro (todos os meses).
 * - `[]` (nenhum mês selecionado) = não retorna nada (`AND 1 = 0`).
 * Os números são validados como inteiros e interpolados com segurança.
 */
function filtroMeses(meses?: number[], coluna = "CAB.DTNEG"): string {
  if (!meses || meses.length >= 12) return "";
  if (meses.length === 0) return "AND 1 = 0";
  const lista = meses
    .map((m) => Math.trunc(Number(m)))
    .filter((m) => m >= 1 && m <= 12);
  if (!lista.length) return "AND 1 = 0";
  if (lista.length >= 12) return "";
  return `AND MONTH(${coluna}) IN (${lista.join(", ")})`;
}

// --- Base de cálculo da Visão Gerencial (espelha o BI antigo) ---
// O relatório antigo somava VLRPED (valor do pedido, com multiplicador por
// tabela de preço) filtrando por CODTIPOPER e DTMOV. Reproduzimos a mesma
// regra sem depender de views.

/** Tipos de operação considerados "venda" na visão gerencial. */
const GER_TOPS = "CAB.CODTIPOPER IN (3100, 888)";

/**
 * VLRPED por nota — lógica inlinada da antiga VIEW_TABX (para não depender de
 * view): soma de `(QTDNEG * VLRUNIT) - VLRDESC` dos itens, com multiplicador
 * conforme o nome da tabela de preço da nota.
 */
const VLRPED_POR_NOTA = `
  (
    SELECT CAB.NUNOTA AS NUNOTA,
           CASE
             WHEN NTA.NOMETAB LIKE '%X%' THEN SUM((ITE.QTDNEG * ITE.VLRUNIT) - ITE.VLRDESC) * 2
             WHEN NTA.NOMETAB LIKE '%IMPORTEC%' THEN SUM((ITE.QTDNEG * ITE.VLRUNIT) - ITE.VLRDESC) * 2
             WHEN NTA.NOMETAB LIKE '%Y%' THEN SUM((ITE.QTDNEG * ITE.VLRUNIT) - ITE.VLRDESC) / 0.75
             ELSE SUM((ITE.QTDNEG * ITE.VLRUNIT) - ITE.VLRDESC)
           END AS VLRPED
    FROM TGFCAB CAB
    LEFT JOIN TGFITE ITE ON ITE.NUNOTA = CAB.NUNOTA
    LEFT JOIN TGFTAB TAB ON TAB.NUTAB = (SELECT MAX(NUTAB) FROM TGFITE I2 WHERE I2.NUNOTA = CAB.NUNOTA)
    LEFT JOIN TGFNTA NTA ON NTA.CODTAB = TAB.CODTAB
    WHERE CAB.CODTIPOPER IN (3100, 888)
    GROUP BY CAB.NUNOTA, NTA.NOMETAB
  )
`;

/**
 * JOINs padrão do BI antigo: nota → parceiro → cidade → UF (inner).
 * Alias `EST` (e não `UF`) para evitar a colisão `UF.UF` (alias = coluna),
 * que quebrava o pré-processador SQL do Sankhya na consulta por UF.
 */
const GER_JOINS_UF = `
  LEFT JOIN ${VLRPED_POR_NOTA} X ON X.NUNOTA = CAB.NUNOTA
  INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
  INNER JOIN TSICID CID ON CID.CODCID = PAR.CODCID
  INNER JOIN TSIUFS EST ON EST.CODUF = CID.UF
`;

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

// A tela "Por Representante" usa a MESMA base do BI antigo/Visão Gerencial
// (CODTIPOPER/DTMOV/VLRPED), filtrada pelo vendedor — para os números baterem
// entre as telas.

/** Total (VLRPED) por ano do representante (gráfico anual). */
export function vendasPorAno(codvend: number, meses?: number[]): Query {
  return {
    sql: `
      SELECT YEAR(CAB.DTMOV) AS ANO,
             SUM(X.VLRPED) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY YEAR(CAB.DTMOV)
      ORDER BY ANO
    `,
    params: [{ value: codvend, type: "I" }],
  };
}

/**
 * Total (VLRPED) acumulado no ano até a data de hoje (mesmo dia/mês), para o
 * ano atual e o anterior — comparação "justa" YTD (2025 × 2026 até a data do
 * relatório), evitando comparar ano incompleto com ano inteiro.
 */
export function resumoAteData(
  codvend: number,
  anoAtual: number,
  anoAnterior: number
): Query {
  return {
    sql: `
      SELECT YEAR(CAB.DTMOV) AS ANO,
             SUM(X.VLRPED) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        AND YEAR(CAB.DTMOV) IN (?, ?)
        AND (
          MONTH(CAB.DTMOV) < MONTH(GETDATE())
          OR (MONTH(CAB.DTMOV) = MONTH(GETDATE()) AND DAY(CAB.DTMOV) <= DAY(GETDATE()))
        )
      GROUP BY YEAR(CAB.DTMOV)
      ORDER BY ANO
    `,
    params: [
      { value: codvend, type: "I" },
      { value: anoAtual, type: "I" },
      { value: anoAnterior, type: "I" },
    ],
  };
}

/**
 * Total (VLRPED) por dia, para o ano atual e o anterior, de 1º de janeiro até
 * a data de hoje (mesmo dia/mês) — visão "dia a dia" (2025 × 2026 até a data do
 * relatório).
 */
export function vendasPorDia(
  codvend: number,
  anoAtual: number,
  anoAnterior: number
): Query {
  return {
    sql: `
      SELECT YEAR(CAB.DTMOV) AS ANO,
             MONTH(CAB.DTMOV) AS MES,
             DAY(CAB.DTMOV) AS DIA,
             SUM(X.VLRPED) AS TOTAL
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        AND YEAR(CAB.DTMOV) IN (?, ?)
        AND (
          MONTH(CAB.DTMOV) < MONTH(GETDATE())
          OR (MONTH(CAB.DTMOV) = MONTH(GETDATE()) AND DAY(CAB.DTMOV) <= DAY(GETDATE()))
        )
      GROUP BY YEAR(CAB.DTMOV), MONTH(CAB.DTMOV), DAY(CAB.DTMOV)
      ORDER BY ANO, MES, DIA
    `,
    params: [
      { value: codvend, type: "I" },
      { value: anoAtual, type: "I" },
      { value: anoAnterior, type: "I" },
    ],
  };
}

/** Total por ano e mês, limitado aos últimos N anos (sazonalidade). */
export function vendasAnoMes(
  codvend: number,
  anos = 4,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT YEAR(CAB.DTMOV) AS ANO,
             MONTH(CAB.DTMOV) AS MES,
             SUM(X.VLRPED) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        AND CAB.DTMOV >= DATEADD(YEAR, ?, GETDATE())
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY YEAR(CAB.DTMOV), MONTH(CAB.DTMOV)
      ORDER BY ANO, MES
    `,
    params: [
      { value: codvend, type: "I" },
      { value: -Math.abs(anos), type: "I" },
    ],
  };
}

/** Total por UF (estado) do representante. */
export function vendasPorUF(codvend: number, meses?: number[]): Query {
  return {
    sql: `
      SELECT EST.UF AS UF,
             SUM(X.VLRPED) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY EST.UF
      ORDER BY TOTAL DESC
    `,
    params: [{ value: codvend, type: "I" }],
  };
}

/** Ranking de clientes do representante (por valor). */
export function topClientes(
  codvend: number,
  limite = 10,
  meses?: number[]
): Query {
  const top = Math.max(1, Math.trunc(limite));
  return {
    sql: `
      SELECT TOP ${top}
             PAR.CODPARC AS CODIGO,
             RTRIM(PAR.NOMEPARC) AS NOME,
             SUM(X.VLRPED) AS TOTAL,
             COUNT(CAB.NUNOTA) AS QTD
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY PAR.CODPARC, PAR.NOMEPARC
      ORDER BY TOTAL DESC
    `,
    params: [{ value: codvend, type: "I" }],
  };
}

/**
 * Ranking de produtos vendidos pelo representante (nível item da nota).
 * Usa o valor líquido do item `(QTDNEG*VLRUNIT)-VLRDESC` — base do VLRPED antes
 * do multiplicador por tabela de preço, que é por nota e não por produto.
 */
export function topProdutos(
  codvend: number,
  limite = 10,
  meses?: number[]
): Query {
  const top = Math.max(1, Math.trunc(limite));
  return {
    sql: `
      SELECT TOP ${top}
             PRO.CODPROD AS CODIGO,
             RTRIM(PRO.DESCRPROD) AS NOME,
             SUM((ITE.QTDNEG * ITE.VLRUNIT) - ITE.VLRDESC) AS TOTAL,
             SUM(ITE.QTDNEG) AS QTD
      FROM TGFCAB CAB
      INNER JOIN TGFITE ITE ON ITE.NUNOTA = CAB.NUNOTA
      INNER JOIN TGFPRO PRO ON PRO.CODPROD = ITE.CODPROD
      INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
      INNER JOIN TSICID CID ON CID.CODCID = PAR.CODCID
      INNER JOIN TSIUFS EST ON EST.CODUF = CID.UF
      WHERE ${GER_TOPS} AND CAB.CODVEND = ?
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY PRO.CODPROD, PRO.DESCRPROD
      ORDER BY TOTAL DESC
    `,
    params: [{ value: codvend, type: "I" }],
  };
}

/**
 * Totais por ano de vários representantes (comparativo) — mesma base do BI.
 * Os códigos são validados como inteiros e interpolados na cláusula IN
 * (evita depender de bind de lista, mantendo a segurança).
 */
export function comparativoRepresentantes(codvends: number[]): Query {
  const lista = codvends
    .map((c) => Math.trunc(Number(c)))
    .filter((c) => Number.isFinite(c) && c > 0);

  const inClause = lista.length ? lista.join(", ") : "-1";

  return {
    sql: `
      SELECT CAB.CODVEND AS CODVEND,
             YEAR(CAB.DTMOV) AS ANO,
             SUM(X.VLRPED) AS TOTAL
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS}
        AND CAB.CODVEND IN (${inClause})
      GROUP BY CAB.CODVEND, YEAR(CAB.DTMOV)
      ORDER BY ANO
    `,
    params: [],
  };
}

// --- Visão gerencial (tela inicial) — espelha o BI antigo ---

/** Filtro de período (sobre DTMOV) para o recorte por ano. */
function filtroPeriodo(periodo: PeriodoSnapshot): string {
  switch (periodo) {
    case "hoje":
      return "AND DAY(CAB.DTMOV) = DAY(GETDATE()) AND MONTH(CAB.DTMOV) = MONTH(GETDATE())";
    case "ontem":
      return "AND DAY(CAB.DTMOV) = DAY(DATEADD(DAY, -1, GETDATE())) AND MONTH(CAB.DTMOV) = MONTH(DATEADD(DAY, -1, GETDATE()))";
    case "mes":
      return "AND MONTH(CAB.DTMOV) = MONTH(GETDATE())";
    default:
      return "";
  }
}

/** Vendas (VLRPED) e nº de notas por ano, recortado por período. */
export function snapshotPorAno(
  periodo: PeriodoSnapshot,
  meses?: number[]
): Query {
  // O filtro de meses só faz sentido no recorte anual.
  const mesesSql = periodo === "ano" ? filtroMeses(meses, "CAB.DTMOV") : "";
  return {
    sql: `
      SELECT YEAR(CAB.DTMOV) AS ANO,
             SUM(X.VLRPED) AS VENDAS,
             COUNT(CAB.NUNOTA) AS PEDIDOS
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      WHERE ${GER_TOPS}
        ${filtroPeriodo(periodo)}
        ${mesesSql}
      GROUP BY YEAR(CAB.DTMOV)
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
  SUM(CASE WHEN YEAR(CAB.DTMOV) = ? THEN X.VLRPED ELSE 0 END) AS VEND_ANT,
  COUNT(CASE WHEN YEAR(CAB.DTMOV) = ? THEN CAB.NUNOTA END) AS PED_ANT,
  SUM(CASE WHEN YEAR(CAB.DTMOV) = ? THEN X.VLRPED ELSE 0 END) AS VEND_ATU,
  COUNT(CASE WHEN YEAR(CAB.DTMOV) = ? THEN CAB.NUNOTA END) AS PED_ATU`;

const WHERE_COMPARATIVO = `
  WHERE ${GER_TOPS}
    AND YEAR(CAB.DTMOV) IN (?, ?)`;

/** Comparativo de vendas por UF (ano anterior × atual). */
export function comparativoUF(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): Query {
  return {
    sql: `
      SELECT EST.UF AS ROTULO,${SELECT_COMPARATIVO}
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      ${WHERE_COMPARATIVO}
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY EST.UF
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
      ${GER_JOINS_UF}
      INNER JOIN TGFVEN VEN ON VEN.CODVEND = CAB.CODVEND
      ${WHERE_COMPARATIVO}
        ${filtroMeses(meses, "CAB.DTMOV")}
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
      SELECT MONTH(CAB.DTMOV) AS MES,${SELECT_COMPARATIVO}
      FROM TGFCAB CAB
      ${GER_JOINS_UF}
      ${WHERE_COMPARATIVO}
        ${filtroMeses(meses, "CAB.DTMOV")}
      GROUP BY MONTH(CAB.DTMOV)
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

  // Modo gerencial: mesma base do BI antigo (CODTIPOPER/DTMOV/VLRPED) para o
  // detalhamento bater com o valor agregado do card.
  const ger = !!ctx.gerencial;
  const dataCol = ger ? "CAB.DTMOV" : "CAB.DTNEG";
  const valorCol = ger ? "X.VLRPED" : "CAB.VLRNOTA";

  const params: SankhyaQueryParam[] = [];
  let where: string;
  if (ger) {
    where = GER_TOPS;
  } else {
    where = "CAB.TIPMOV = ? AND CAB.STATUSNOTA = 'L'";
    params.push({ value: ctx.tipmov, type: "S" });
  }

  if (ctx.ano != null) {
    where += ` AND YEAR(${dataCol}) = ?`;
    params.push({ value: ctx.ano, type: "I" });
  } else if (
    !ctx.todosAnos &&
    ctx.anoAtual != null &&
    ctx.anoAnterior != null
  ) {
    where += ` AND YEAR(${dataCol}) IN (?, ?)`;
    params.push(
      { value: ctx.anoAtual, type: "I" },
      { value: ctx.anoAnterior, type: "I" }
    );
  }

  if (ctx.mes != null) {
    where += ` AND MONTH(${dataCol}) = ?`;
    params.push({ value: ctx.mes, type: "I" });
  } else {
    const fm = filtroMeses(ctx.meses, dataCol);
    if (fm) where += ` ${fm}`;
  }

  if (ctx.uf) {
    where += " AND EST.UF = ?";
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

  const vlrpedJoin = ger
    ? `LEFT JOIN ${VLRPED_POR_NOTA} X ON X.NUNOTA = CAB.NUNOTA`
    : "";
  const geoJoins = ger
    ? `INNER JOIN TSICID CID ON CID.CODCID = PAR.CODCID
       INNER JOIN TSIUFS EST ON EST.CODUF = CID.UF`
    : `LEFT JOIN TSICID CID ON CID.CODCID = PAR.CODCID
       LEFT JOIN TSIUFS EST ON EST.CODUF = CID.UF`;

  return {
    sql: `
      SELECT CAB.NUNOTA AS NUNOTA,
             CONVERT(VARCHAR(10), ${dataCol}, 120) AS DATA,
             RTRIM(PAR.NOMEPARC) AS CLIENTE,
             RTRIM(VEN.APELIDO) AS VENDEDOR,
             EST.UF AS UF,
             ${valorCol} AS VALOR
      FROM TGFCAB CAB
      ${vlrpedJoin}
      INNER JOIN TGFPAR PAR ON PAR.CODPARC = CAB.CODPARC
      LEFT JOIN TGFVEN VEN ON VEN.CODVEND = CAB.CODVEND
      ${geoJoins}
      WHERE ${where}
      ORDER BY ${dataCol} DESC
      OFFSET ${off} ROWS FETCH NEXT ${lim} ROWS ONLY
    `,
    params,
  };
}

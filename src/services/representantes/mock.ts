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
  VendaUF,
} from "./types";

/**
 * Dados fictícios determinísticos para desenvolvimento fora do Sankhya
 * (`pnpm dev`). Um histórico mensal por representante é gerado e todas as
 * outras visões são derivadas dele, mantendo os números consistentes entre
 * gráficos, KPIs e tabelas.
 */

const START_YEAR = 2019;

/** PRNG determinístico (mulberry32) para dados estáveis por semente. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MOCK_REPRESENTANTES: Representante[] = [
  { codvend: 101, nome: "Ana Beatriz Ramos" },
  { codvend: 102, nome: "Carlos Eduardo Lima" },
  { codvend: 103, nome: "Fernanda Souza" },
  { codvend: 104, nome: "Gustavo Henrique" },
  { codvend: 105, nome: "Juliana Martins" },
  { codvend: 106, nome: "Marcelo Tavares" },
  { codvend: 107, nome: "Patrícia Nogueira" },
  { codvend: 108, nome: "Rodrigo Alencar" },
];

const UFS = ["SP", "MG", "RJ", "PR", "RS", "SC", "BA", "GO", "PE", "CE"];

const CLIENTES = [
  "Comercial Aurora Ltda",
  "Distribuidora Vale Verde",
  "Supermercados União",
  "Atacadão Primavera",
  "Mercantil Boa Vista",
  "Rede Popular Varejo",
  "Armazém Central",
  "Casa & Cia Distribuição",
  "Empório do Norte",
  "Grupo Sul Atacado",
  "Varejo Já S/A",
  "Conveniência Express",
];

const PRODUTOS = [
  "Refrigerante Cola 2L",
  "Água Mineral 500ml",
  "Suco Integral Uva 1L",
  "Energético Lata 269ml",
  "Cerveja Pilsen 350ml",
  "Achocolatado em Pó 400g",
  "Café Torrado 500g",
  "Óleo de Soja 900ml",
  "Arroz Tipo 1 5kg",
  "Feijão Carioca 1kg",
  "Biscoito Recheado 130g",
  "Sabão em Pó 1kg",
];

function tipmovFactor(tipmov: TipMov): number {
  // Pedidos costumam ser um pouco maiores que o faturamento efetivo.
  return tipmov === "P" ? 1.18 : 1;
}

function now() {
  return new Date();
}

/** Histórico mensal completo (todos os anos) de um representante. */
function historicoMensal(codvend: number, tipmov: TipMov): VendaAnoMes[] {
  const rand = rng(codvend * 7919 + (tipmov === "P" ? 13 : 0));
  const baseMensal = 40000 + rand() * 90000; // R$ base por mês
  const ticket = 900 + rand() * 2600;
  const fator = tipmovFactor(tipmov);

  const hoje = now();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const linhas: VendaAnoMes[] = [];

  for (let ano = START_YEAR; ano <= anoAtual; ano++) {
    const crescimento = 1 + (ano - START_YEAR) * (0.06 + rand() * 0.08);
    const ultimoMes = ano === anoAtual ? mesAtual : 12;

    for (let mes = 1; mes <= ultimoMes; mes++) {
      // Sazonalidade: pico no meio do ano e forte em novembro/dezembro.
      const sazonal =
        1 +
        0.28 * Math.sin(((mes - 3) / 12) * 2 * Math.PI) +
        (mes >= 11 ? 0.35 : 0);
      const ruido = 0.8 + rand() * 0.45;

      const total = Math.round(
        baseMensal * crescimento * sazonal * ruido * fator
      );
      const qtd = Math.max(1, Math.round(total / ticket));

      linhas.push({ ano, mes, total, qtd });
    }
  }

  return linhas;
}

export function mockRepresentantes(): Representante[] {
  return [...MOCK_REPRESENTANTES];
}

/**
 * True quando o mês entra no filtro.
 * - `undefined` ou 12 meses = todos.
 * - `[]` (nenhum selecionado) = nenhum.
 */
function incluiMes(meses: number[] | undefined, mes: number): boolean {
  if (!meses || meses.length >= 12) return true;
  if (meses.length === 0) return false;
  return meses.includes(mes);
}

export function mockVendasAnoMes(
  codvend: number,
  tipmov: TipMov,
  anos = 4,
  meses?: number[]
): VendaAnoMes[] {
  const hist = historicoMensal(codvend, tipmov);
  const anoAtual = now().getFullYear();
  const corte = anoAtual - Math.abs(anos) + 1;
  return hist.filter((l) => l.ano >= corte && incluiMes(meses, l.mes));
}

export function mockVendasAno(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): VendaAno[] {
  const hist = historicoMensal(codvend, tipmov).filter((l) =>
    incluiMes(meses, l.mes)
  );
  const porAno = new Map<number, VendaAno>();

  for (const l of hist) {
    const atual = porAno.get(l.ano) ?? { ano: l.ano, total: 0, qtd: 0 };
    atual.total += l.total;
    atual.qtd += l.qtd;
    porAno.set(l.ano, atual);
  }

  return [...porAno.values()].sort((a, b) => a.ano - b.ano);
}

function totalHistorico(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): number {
  return historicoMensal(codvend, tipmov)
    .filter((l) => incluiMes(meses, l.mes))
    .reduce((s, l) => s + l.total, 0);
}

export function mockVendasUF(
  codvend: number,
  tipmov: TipMov,
  meses?: number[]
): VendaUF[] {
  const rand = rng(codvend * 104729);
  const total = totalHistorico(codvend, tipmov, meses);

  // Cada representante atua em um subconjunto de UFs com pesos aleatórios.
  const qtdUfs = 4 + Math.floor(rand() * 4);
  const escolhidas = [...UFS]
    .sort(() => rand() - 0.5)
    .slice(0, qtdUfs);

  const pesos = escolhidas.map(() => 0.2 + rand());
  const somaPesos = pesos.reduce((s, p) => s + p, 0);

  return escolhidas
    .map((uf, i) => {
      const fracao = pesos[i] / somaPesos;
      const valor = Math.round(total * fracao);
      return {
        uf,
        total: valor,
        qtd: Math.max(1, Math.round(valor / 1800)),
      };
    })
    .sort((a, b) => b.total - a.total);
}

function ranking(
  codvend: number,
  tipmov: TipMov,
  nomes: string[],
  seedSalt: number,
  ticket: number,
  limite: number,
  meses?: number[]
): TopItem[] {
  const rand = rng(codvend * 31 + seedSalt);
  const total = totalHistorico(codvend, tipmov, meses);

  const itens = nomes
    .map((nome, i) => ({ nome, codigo: 1000 + i, peso: 0.3 + rand() }))
    .sort((a, b) => b.peso - a.peso)
    .slice(0, limite);

  const somaPesos = itens.reduce((s, it) => s + it.peso, 0);

  return itens.map((it) => {
    const valor = Math.round((total * 0.65 * it.peso) / somaPesos);
    return {
      codigo: it.codigo,
      nome: it.nome,
      total: valor,
      qtd: Math.max(1, Math.round(valor / ticket)),
    };
  });
}

export function mockTopClientes(
  codvend: number,
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): TopItem[] {
  return ranking(codvend, tipmov, CLIENTES, 3, 2200, limite, meses);
}

export function mockTopProdutos(
  codvend: number,
  tipmov: TipMov,
  limite = 10,
  meses?: number[]
): TopItem[] {
  return ranking(codvend, tipmov, PRODUTOS, 97, 45, limite, meses);
}

export function mockComparativo(
  codvends: number[],
  tipmov: TipMov
): ComparativoPonto[] {
  const pontos: ComparativoPonto[] = [];
  for (const codvend of codvends) {
    for (const va of mockVendasAno(codvend, tipmov)) {
      pontos.push({ codvend, ano: va.ano, total: va.total });
    }
  }
  return pontos;
}

// --- Visão gerencial (agregada entre todos os representantes) ---

function pct(atual: number, anterior: number): number | null {
  return anterior ? (atual / anterior - 1) * 100 : null;
}

/** Agrega o histórico mensal de faturamento de todos os representantes. */
function agregadoMensal(meses?: number[]): VendaAnoMes[] {
  const mapa = new Map<string, VendaAnoMes>();
  for (const rep of MOCK_REPRESENTANTES) {
    for (const l of historicoMensal(rep.codvend, "V")) {
      if (!incluiMes(meses, l.mes)) continue;
      const chave = `${l.ano}-${l.mes}`;
      const atual =
        mapa.get(chave) ?? { ano: l.ano, mes: l.mes, total: 0, qtd: 0 };
      atual.total += l.total;
      atual.qtd += l.qtd;
      mapa.set(chave, atual);
    }
  }
  return [...mapa.values()];
}

export function mockSnapshotAno(
  periodo: PeriodoSnapshot,
  meses?: number[]
): SnapshotAno[] {
  // Filtro de meses só se aplica ao recorte anual.
  const mensal = agregadoMensal(periodo === "ano" ? meses : undefined);
  const mesAtual = now().getMonth() + 1;

  // Fator do recorte (aproximação sobre o total mensal para dias).
  const fatorDia = (fator: number) =>
    mensal
      .filter((l) => l.mes === mesAtual)
      .reduce<Map<number, { vendas: number; pedidos: number }>>((acc, l) => {
        const cur = acc.get(l.ano) ?? { vendas: 0, pedidos: 0 };
        cur.vendas += (l.total / 30) * fator;
        cur.pedidos += Math.round((l.qtd / 30) * fator);
        acc.set(l.ano, cur);
        return acc;
      }, new Map());

  let porAno = new Map<number, { vendas: number; pedidos: number }>();

  if (periodo === "ano") {
    for (const l of mensal) {
      const cur = porAno.get(l.ano) ?? { vendas: 0, pedidos: 0 };
      cur.vendas += l.total;
      cur.pedidos += l.qtd;
      porAno.set(l.ano, cur);
    }
  } else if (periodo === "mes") {
    for (const l of mensal.filter((x) => x.mes === mesAtual)) {
      const cur = porAno.get(l.ano) ?? { vendas: 0, pedidos: 0 };
      cur.vendas += l.total;
      cur.pedidos += l.qtd;
      porAno.set(l.ano, cur);
    }
  } else {
    porAno = fatorDia(periodo === "ontem" ? 0.92 : 1);
  }

  const linhas = [...porAno.entries()]
    .map(([ano, v]) => ({
      ano,
      vendas: Math.round(v.vendas),
      pedidos: v.pedidos,
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

/** Total anual agregado (faturamento e nº de notas) por ano. */
function totaisAnuais(
  meses?: number[]
): Map<number, { vendas: number; pedidos: number }> {
  const mapa = new Map<number, { vendas: number; pedidos: number }>();
  for (const l of agregadoMensal(meses)) {
    const cur = mapa.get(l.ano) ?? { vendas: 0, pedidos: 0 };
    cur.vendas += l.total;
    cur.pedidos += l.qtd;
    mapa.set(l.ano, cur);
  }
  return mapa;
}

export function mockComparativoUF(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): LinhaComparativa[] {
  const totais = totaisAnuais(meses);
  const vAtu = totais.get(anoAtual)?.vendas ?? 0;
  const vAnt = totais.get(anoAnterior)?.vendas ?? 0;

  const rand = rng(4242);
  const pesos = UFS.map(() => 0.2 + rand());
  const soma = pesos.reduce((s, p) => s + p, 0);

  return UFS.map((uf, i) => {
    const frac = pesos[i] / soma;
    const vendAtu = Math.round(vAtu * frac);
    const vendAnt = Math.round(vAnt * frac * (0.85 + rand() * 0.4));
    const pedAnt = Math.max(0, Math.round(vendAnt / 1800));
    const pedAtu = Math.max(0, Math.round(vendAtu / 1800));
    return {
      rotulo: uf,
      vendAnt,
      pedAnt,
      vendAtu,
      pedAtu,
      pctVend: pct(vendAtu, vendAnt),
      pctPed: pct(pedAtu, pedAnt),
    };
  })
    .sort((a, b) => b.vendAtu - a.vendAtu)
    .map((l, i) => ({ ...l, rk: i + 1 }));
}

export function mockComparativoRepresentantes(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): LinhaComparativa[] {
  return MOCK_REPRESENTANTES.map((rep) => {
    const anos = mockVendasAno(rep.codvend, "V", meses);
    const atu = anos.find((a) => a.ano === anoAtual);
    const ant = anos.find((a) => a.ano === anoAnterior);
    const vendAtu = atu?.total ?? 0;
    const vendAnt = ant?.total ?? 0;
    const pedAnt = ant?.qtd ?? 0;
    const pedAtu = atu?.qtd ?? 0;
    return {
      rotulo: rep.nome,
      codigo: rep.codvend,
      vendAnt,
      pedAnt,
      vendAtu,
      pedAtu,
      pctVend: pct(vendAtu, vendAnt),
      pctPed: pct(pedAtu, pedAnt),
    };
  })
    .filter((l) => l.vendAnt + l.vendAtu > 0)
    .sort((a, b) => b.vendAtu - a.vendAtu)
    .map((l, i) => ({ ...l, rk: i + 1 }));
}

export function mockComparativoMensal(
  anoAtual: number,
  anoAnterior: number,
  meses?: number[]
): LinhaComparativa[] {
  const mensal = agregadoMensal();

  return Array.from({ length: 12 }, (_, idx) => idx + 1)
    .filter((mes) => incluiMes(meses, mes))
    .map((mes) => {
      const atu = mensal.find((l) => l.ano === anoAtual && l.mes === mes);
      const ant = mensal.find((l) => l.ano === anoAnterior && l.mes === mes);
      const vendAtu = atu?.total ?? 0;
      const vendAnt = ant?.total ?? 0;
      const pedAnt = ant?.qtd ?? 0;
      const pedAtu = atu?.qtd ?? 0;
      return {
        rotulo: MESES_NOMES[mes],
        ordem: mes,
        vendAnt,
        pedAnt,
        vendAtu,
        pedAtu,
        pctVend: pct(vendAtu, vendAnt),
        pctPed: pct(pedAtu, pedAnt),
      };
    });
}

const MESES_NOMES = [
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

// --- Drill-down: notas fictícias que compõem um dado agregado ---

const START_YEAR_DRILL = 2019;

function hashCtx(ctx: DrillContexto): number {
  const s = [
    ctx.tipmov,
    ctx.ano ?? "",
    ctx.mes ?? "",
    ctx.uf ?? "",
    ctx.codvend ?? "",
    ctx.codparc ?? "",
    ctx.codprod ?? "",
    ctx.todosAnos ? "T" : "",
  ].join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Gera notas fictícias que compõem o dado clicado, honrando a dimensão do
 * contexto (ano/mês/UF/vendedor/cliente/produto).
 */
export function mockRegistrosDetalhe(ctx: DrillContexto): RegistroDetalhe[] {
  const rand = rng(hashCtx(ctx));
  const anoAtual = now().getFullYear();

  // Anos considerados.
  let anos: number[];
  if (ctx.ano != null) {
    anos = [ctx.ano];
  } else if (ctx.todosAnos) {
    anos = [];
    for (let a = START_YEAR_DRILL; a <= anoAtual; a++) anos.push(a);
  } else if (ctx.anoAtual != null && ctx.anoAnterior != null) {
    anos = [ctx.anoAnterior, ctx.anoAtual];
  } else {
    anos = [anoAtual];
  }

  // Meses considerados.
  const mesesBase =
    ctx.mes != null ? [ctx.mes] : Array.from({ length: 12 }, (_, i) => i + 1);
  const meses = mesesBase.filter((m) => incluiMes(ctx.meses, m));
  if (!meses.length) meses.push(ctx.mes ?? 1);

  // Descrição principal: se filtrou por cliente, mostra o produto; caso
  // contrário mostra o cliente comprador.
  const usarProdutoComoDescricao = ctx.codparc != null;
  const listaDescricao = usarProdutoComoDescricao ? PRODUTOS : CLIENTES;
  const ticket = usarProdutoComoDescricao ? 60 : 2500;

  // Campo auxiliar: UF quando o recorte já é por vendedor; senão o vendedor.
  const vendedores = MOCK_REPRESENTANTES.map((r) => r.nome);
  const mostrarUf = ctx.codvend != null || ctx.uf != null;

  const n = 24 + Math.floor(rand() * 60);
  const registros: RegistroDetalhe[] = [];

  for (let i = 0; i < n; i++) {
    const ano = anos[Math.floor(rand() * anos.length)];
    const mes = meses[Math.floor(rand() * meses.length)];
    const dia = 1 + Math.floor(rand() * 28);
    const valor = Math.round((ticket * 0.4 + rand() * ticket * 2.6) * 100) / 100;
    const descricao = listaDescricao[Math.floor(rand() * listaDescricao.length)];
    const extra = mostrarUf
      ? ctx.uf ?? UFS[Math.floor(rand() * UFS.length)]
      : vendedores[Math.floor(rand() * vendedores.length)];

    registros.push({
      id: `${ano}${pad2(mes)}${pad2(dia)}-${i}`,
      descricao,
      valor,
      periodo: `${ano}-${pad2(mes)}-${pad2(dia)}`,
      extra,
    });
  }

  return registros.sort((a, b) => b.periodo.localeCompare(a.periodo));
}

import { useCallback, useEffect, useState } from "react";

import {
  getComparativo,
  getComparativoMensal,
  getComparativoRepresentantesGerencial,
  getComparativoUF,
  getRepresentantes,
  getResumoAteData,
  getSnapshotAno,
  getTopClientes,
  getTopProdutos,
  getVendasAno,
  getVendasAnoMes,
  getVendasPorDia,
  getVendasUF,
} from "@/services/representantes/repository";
import type {
  ComparativoPonto,
  LinhaComparativa,
  Representante,
  SnapshotAno,
  TipMov,
  TopItem,
  VendaAno,
  VendaAnoMes,
  VendaDia,
  VendaUF,
} from "@/services/representantes/types";

function mensagemErro(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e && "statusMessage" in e) {
    return String((e as { statusMessage: unknown }).statusMessage);
  }
  return "Não foi possível carregar os dados do Sankhya.";
}

/** Lista de representantes ativos (carregada uma vez). */
export function useRepresentantes() {
  const [data, setData] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    getRepresentantes()
      .then((d) => !cancelado && setData(d))
      .catch((e) => !cancelado && setError(mensagemErro(e)))
      .finally(() => !cancelado && setLoading(false));
    return () => {
      cancelado = true;
    };
  }, []);

  return { data, loading, error };
}

export interface VendasRepresentante {
  ano: VendaAno[];
  anoMes: VendaAnoMes[];
  uf: VendaUF[];
  topClientes: TopItem[];
  topProdutos: TopItem[];
  /** YTD (até a data de hoje) do ano anterior e atual, para comparação justa. */
  ateData: VendaAno[];
  /** Vendas dia a dia (até a data de hoje) do ano anterior e atual. */
  dia: VendaDia[];
}

/** Todos os conjuntos de dados de um representante para o dashboard. */
export function useVendasRepresentante(
  codvends: number[] | null,
  tipmov: TipMov,
  anoAtual: number,
  anoAnterior: number,
  anos = 4,
  meses: number[] = []
) {
  const [data, setData] = useState<VendasRepresentante | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chaveMeses = meses.join(",");
  const chaveCodvends = codvends?.join(",") ?? "";

  useEffect(() => {
    if (!codvends || !codvends.length) {
      setData(null);
      setError(null);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getVendasAno(codvends, tipmov, meses),
      getVendasAnoMes(codvends, tipmov, anos, meses),
      getVendasUF(codvends, tipmov, meses),
      getTopClientes(codvends, tipmov, 10, meses),
      getTopProdutos(codvends, tipmov, 10, meses),
      getResumoAteData(codvends, anoAtual, anoAnterior),
      getVendasPorDia(codvends, anoAtual, anoAnterior),
    ])
      .then(([ano, anoMes, uf, topClientes, topProdutos, ateData, dia]) => {
        if (cancelado) return;
        setData({ ano, anoMes, uf, topClientes, topProdutos, ateData, dia });
      })
      .catch((e) => {
        if (cancelado) return;
        setError(mensagemErro(e));
        setData(null);
      })
      .finally(() => !cancelado && setLoading(false));

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveCodvends, tipmov, anoAtual, anoAnterior, anos, chaveMeses]);

  return { data, loading, error };
}

export interface GerencialData {
  ontem: SnapshotAno[];
  hoje: SnapshotAno[];
  mes: SnapshotAno[];
  ano: SnapshotAno[];
  uf: LinhaComparativa[];
  representantes: LinhaComparativa[];
  mensal: LinhaComparativa[];
}

type SecaoGerencial = keyof GerencialData;

/** Marca de quais seções já carregaram (para skeleton por card). */
export type ProntoGerencial = Record<SecaoGerencial, boolean>;

export interface GerencialResultado {
  data: GerencialData;
  pronto: ProntoGerencial;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const GERENCIAL_VAZIO: GerencialData = {
  ontem: [],
  hoje: [],
  mes: [],
  ano: [],
  uf: [],
  representantes: [],
  mensal: [],
};

const NADA_PRONTO: ProntoGerencial = {
  ontem: false,
  hoje: false,
  mes: false,
  ano: false,
  uf: false,
  representantes: false,
  mensal: false,
};

/**
 * Todos os conjuntos da visão gerencial (tela inicial).
 *
 * Cada seção é carregada de forma independente e renderizada assim que chega
 * (as consultas rápidas não esperam a mais lenta). Uma seção que falhar não
 * bloqueia as demais; `retry` recarrega tudo.
 */
export function useGerencial(
  anoAtual: number,
  anoAnterior: number,
  meses: number[] = []
): GerencialResultado {
  const [data, setData] = useState<GerencialData>(GERENCIAL_VAZIO);
  const [pronto, setPronto] = useState<ProntoGerencial>(NADA_PRONTO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const chaveMeses = meses.join(",");

  const retry = useCallback(() => setTentativa((t) => t + 1), []);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);
    setData(GERENCIAL_VAZIO);
    setPronto(NADA_PRONTO);

    // Thunks (não disparam sozinhos): mais leves primeiro, pesados no fim.
    const tarefas: [
      SecaoGerencial,
      () => Promise<SnapshotAno[] | LinhaComparativa[]>
    ][] = [
      ["ontem", () => getSnapshotAno("ontem")],
      ["hoje", () => getSnapshotAno("hoje")],
      ["mes", () => getSnapshotAno("mes")],
      ["ano", () => getSnapshotAno("ano", meses)],
      ["uf", () => getComparativoUF(anoAtual, anoAnterior, meses)],
      [
        "representantes",
        () => getComparativoRepresentantesGerencial(anoAtual, anoAnterior, meses),
      ],
      ["mensal", () => getComparativoMensal(anoAtual, anoAnterior, meses)],
    ];

    // Consultas pesadas (subquery do VLRPED): limita a concorrência para não
    // sobrecarregar o Sankhya (7 simultâneas causavam timeouts/erros).
    const CONCORRENCIA = 2;
    let proxima = 0;
    let sucessos = 0;
    let ultimoErro: unknown = null;

    async function worker() {
      while (!cancelado && proxima < tarefas.length) {
        const [secao, fn] = tarefas[proxima++];
        try {
          const resultado = await fn();
          if (cancelado) return;
          sucessos += 1;
          setData((atual) => ({ ...atual, [secao]: resultado }));
        } catch (e) {
          ultimoErro = e;
          console.error(`[useGerencial] falha ao carregar "${secao}":`, e);
        } finally {
          // Mostra o card (dados ou "sem dados") em vez de skeleton eterno.
          if (!cancelado) setPronto((atual) => ({ ...atual, [secao]: true }));
        }
      }
    }

    const pool = Array.from(
      { length: Math.min(CONCORRENCIA, tarefas.length) },
      () => worker()
    );
    Promise.all(pool).finally(() => {
      if (cancelado) return;
      setLoading(false);
      if (sucessos === 0) setError(mensagemErro(ultimoErro));
    });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anoAtual, anoAnterior, chaveMeses, tentativa]);

  return { data, pronto, loading, error, retry };
}

/** Comparativo anual entre vários representantes. */
export function useComparativo(codvends: number[], tipmov: TipMov) {
  const [data, setData] = useState<ComparativoPonto[]>([]);
  const [loading, setLoading] = useState(false);
  const chave = codvends.join(",");

  useEffect(() => {
    if (!codvends.length) {
      setData([]);
      return;
    }

    let cancelado = false;
    setLoading(true);

    getComparativo(codvends, tipmov)
      .then((d) => !cancelado && setData(d))
      .catch(() => !cancelado && setData([]))
      .finally(() => !cancelado && setLoading(false));

    return () => {
      cancelado = true;
    };
    // `chave` representa o conteúdo de `codvends` de forma estável.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, tipmov]);

  return { data, loading };
}

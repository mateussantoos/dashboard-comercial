import { useCallback, useEffect, useState } from "react";

import {
  getComparativo,
  getComparativoMensal,
  getComparativoRepresentantesGerencial,
  getComparativoUF,
  getRepresentantes,
  getSnapshotAno,
  getTopClientes,
  getTopProdutos,
  getVendasAno,
  getVendasAnoMes,
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
}

/** Todos os conjuntos de dados de um representante para o dashboard. */
export function useVendasRepresentante(
  codvend: number | null,
  tipmov: TipMov,
  anos = 4,
  meses: number[] = []
) {
  const [data, setData] = useState<VendasRepresentante | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chaveMeses = meses.join(",");

  useEffect(() => {
    if (codvend == null) {
      setData(null);
      setError(null);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getVendasAno(codvend, tipmov, meses),
      getVendasAnoMes(codvend, tipmov, anos, meses),
      getVendasUF(codvend, tipmov, meses),
      getTopClientes(codvend, tipmov, 10, meses),
      getTopProdutos(codvend, tipmov, 10, meses),
    ])
      .then(([ano, anoMes, uf, topClientes, topProdutos]) => {
        if (cancelado) return;
        setData({ ano, anoMes, uf, topClientes, topProdutos });
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
  }, [codvend, tipmov, anos, chaveMeses]);

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

const TUDO_PRONTO: ProntoGerencial = {
  ontem: true,
  hoje: true,
  mes: true,
  ano: true,
  uf: true,
  representantes: true,
  mensal: true,
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

    const tarefas: [SecaoGerencial, Promise<SnapshotAno[] | LinhaComparativa[]>][] =
      [
        ["ontem", getSnapshotAno("ontem")],
        ["hoje", getSnapshotAno("hoje")],
        ["mes", getSnapshotAno("mes")],
        ["ano", getSnapshotAno("ano", meses)],
        ["uf", getComparativoUF(anoAtual, anoAnterior, meses)],
        [
          "representantes",
          getComparativoRepresentantesGerencial(anoAtual, anoAnterior, meses),
        ],
        ["mensal", getComparativoMensal(anoAtual, anoAnterior, meses)],
      ];

    let pendentes = tarefas.length;
    let sucessos = 0;
    let ultimoErro: unknown = null;

    for (const [secao, promessa] of tarefas) {
      promessa
        .then((resultado) => {
          if (cancelado) return;
          sucessos += 1;
          setData((atual) => ({ ...atual, [secao]: resultado }));
          setPronto((atual) => ({ ...atual, [secao]: true }));
        })
        .catch((e) => {
          ultimoErro = e;
          console.error(`[useGerencial] falha ao carregar "${secao}":`, e);
        })
        .finally(() => {
          if (cancelado) return;
          pendentes -= 1;
          if (pendentes === 0) {
            setLoading(false);
            // Evita cards presos em skeleton eterno: seções que falharam
            // ficam "prontas" (vazias). Só há erro global se tudo falhou.
            setPronto(TUDO_PRONTO);
            if (sucessos === 0) setError(mensagemErro(ultimoErro));
          }
        });
    }

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

import { useEffect, useState } from "react";

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

/** Todos os conjuntos da visão gerencial (tela inicial). */
export function useGerencial(
  anoAtual: number,
  anoAnterior: number,
  meses: number[] = []
) {
  const [data, setData] = useState<GerencialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chaveMeses = meses.join(",");

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    Promise.all([
      getSnapshotAno("ontem"),
      getSnapshotAno("hoje"),
      getSnapshotAno("mes"),
      getSnapshotAno("ano", meses),
      getComparativoUF(anoAtual, anoAnterior, meses),
      getComparativoRepresentantesGerencial(anoAtual, anoAnterior, meses),
      getComparativoMensal(anoAtual, anoAnterior, meses),
    ])
      .then(([ontem, hoje, mes, ano, uf, representantes, mensal]) => {
        if (cancelado) return;
        setData({ ontem, hoje, mes, ano, uf, representantes, mensal });
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
  }, [anoAtual, anoAnterior, chaveMeses]);

  return { data, loading, error };
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

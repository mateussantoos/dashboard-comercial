import { useMemo } from "react";

import { useLocalStorage } from "./use-local-storage";
import type { Coluna } from "@/components/dashboard/generic-table";

export interface ColunaConfig {
  key: string;
  visivel: boolean;
}

/**
 * Gerencia visibilidade e ordem das colunas de uma tabela, persistindo a
 * escolha no navegador (localStorage) por `storageKey`.
 */
export function useColumnConfig<T>(storageKey: string, colunas: Coluna<T>[]) {
  const inicial: ColunaConfig[] = colunas.map((c) => ({
    key: c.key as string,
    visivel: true,
  }));

  const [salvo, setConfig] = useLocalStorage<ColunaConfig[]>(
    `cols:${storageKey}`,
    inicial
  );

  // Reconcilia o que está salvo com as colunas atuais (adiciona novas, remove
  // as que não existem mais) preservando a ordem escolhida pelo usuário.
  const config = useMemo(() => {
    const conhecidas = new Set(colunas.map((c) => c.key as string));
    const mantidas = salvo.filter((c) => conhecidas.has(c.key));
    const faltantes = colunas
      .filter((c) => !mantidas.some((m) => m.key === (c.key as string)))
      .map((c) => ({ key: c.key as string, visivel: true }));
    return [...mantidas, ...faltantes];
  }, [salvo, colunas]);

  const mapa = useMemo(
    () => new Map(colunas.map((c) => [c.key as string, c])),
    [colunas]
  );

  const colunasVisiveis = useMemo(
    () =>
      config
        .filter((c) => c.visivel)
        .map((c) => mapa.get(c.key))
        .filter((c): c is Coluna<T> => Boolean(c)),
    [config, mapa]
  );

  return { config, setConfig, colunasVisiveis, mapa };
}

import { useEffect, useMemo, useState } from "react";

import { useSankhya } from "@/contexts/sankhya-context";
import type { TipMov } from "@/services/representantes/types";
import { useGerencial, useRepresentantes } from "@/hooks/use-dashboard-data";
import { useLocalStorage } from "@/hooks/use-local-storage";

import { Sidebar, type Tela } from "@/components/dashboard/sidebar";
import { TelaGerencial } from "@/components/dashboard/tela-gerencial";
import { TelaRepresentante } from "@/components/dashboard/tela-representante";
import { TelaComparar } from "@/components/dashboard/tela-comparar";
import {
  ZOOM_MAX,
  ZOOM_MIN,
  type Densidade,
  type GerencialControles,
} from "@/components/dashboard/gerencial-toolbar";

const MODO_DEMO =
  import.meta.env.DEV && typeof window.executeQuery !== "function";

const TODOS_MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const arredonda = (n: number) => Math.round(n * 10) / 10;

function App() {
  const sankhya = useSankhya();
  const { data: representantes, loading: loadingReps } = useRepresentantes();

  const anoCorrente = new Date().getFullYear();
  const anosDisponiveis = useMemo(() => {
    const anos: number[] = [];
    for (let a = anoCorrente; a >= 2016; a--) anos.push(a);
    return anos;
  }, [anoCorrente]);

  const [tela, setTela] = useState<Tela>("gerencial");
  const [colapsado, setColapsado] = useLocalStorage("sidebar:colapsado", false);
  const [tipmov, setTipmov] = useState<TipMov>("V");
  const [anoAtual, setAnoAtual] = useState(anoCorrente);
  const [anoAnterior, setAnoAnterior] = useState(anoCorrente - 1);
  const [meses, setMeses] = useState<number[]>(TODOS_MESES);

  // Preferências de visualização (persistem no navegador).
  const [densidade, setDensidade] = useLocalStorage<Densidade>(
    "dash:densidade",
    "confortavel"
  );
  const [zoom, setZoom] = useLocalStorage<number>("dash:zoom", 1);
  // Muda a `key` do conteúdo para remontar as telas (reseta configs de coluna).
  const [resetKey, setResetKey] = useState(0);

  // Dados da Visão Gerencial ficam no App: carregam uma vez e sobrevivem à
  // troca de telas (evita recarregar/cancelar ao navegar e voltar).
  const gerencial = useGerencial(anoAtual, anoAnterior, meses);

  // Dentro do Sankhya, expande o componente para tela cheia (no-op no dev).
  useEffect(() => {
    void sankhya.removeFrame({
      instance: "DASH_COMERCIAL",
      initialPage: "index.jsp",
    });
  }, [sankhya]);

  function resetarTudo() {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    setTipmov("V");
    setAnoAtual(anoCorrente);
    setAnoAnterior(anoCorrente - 1);
    setMeses(TODOS_MESES);
    setTela("gerencial");
    setColapsado(false);
    setDensidade("confortavel");
    setZoom(1);
    setResetKey((k) => k + 1); // remonta telas → volta ordem/ocultação de colunas
    gerencial.retry();
  }

  const controles: GerencialControles = {
    densidade,
    onToggleDensidade: () =>
      setDensidade((d) => (d === "compacto" ? "confortavel" : "compacto")),
    zoom,
    onZoomIn: () => setZoom((z) => Math.min(ZOOM_MAX, arredonda(z + 0.1))),
    onZoomOut: () => setZoom((z) => Math.max(ZOOM_MIN, arredonda(z - 0.1))),
    onReload: () => gerencial.retry(),
    onReset: resetarTudo,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        tela={tela}
        onTelaChange={setTela}
        colapsado={colapsado}
        onToggleColapsar={() => setColapsado((c) => !c)}
        tipmov={tipmov}
        onTipmovChange={setTipmov}
        anoAtual={anoAtual}
        anoAnterior={anoAnterior}
        onAnoAtualChange={setAnoAtual}
        onAnoAnteriorChange={setAnoAnterior}
        anosDisponiveis={anosDisponiveis}
        meses={meses}
        onMesesChange={setMeses}
        modoDemo={MODO_DEMO}
      />

      <main
        key={resetKey}
        data-density={densidade}
        style={{ zoom }}
        className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6"
      >
        {tela === "gerencial" ? (
          <TelaGerencial
            anoAtual={anoAtual}
            anoAnterior={anoAnterior}
            meses={meses}
            data={gerencial.data}
            pronto={gerencial.pronto}
            error={gerencial.error}
            onRetry={gerencial.retry}
            controles={controles}
          />
        ) : tela === "comparar" ? (
          <TelaComparar
            representantes={representantes}
            loadingReps={loadingReps}
            tipmov={tipmov}
            meses={meses}
            anoAtual={anoAtual}
            anoAnterior={anoAnterior}
          />
        ) : (
          <TelaRepresentante
            representantes={representantes}
            loadingReps={loadingReps}
            tipmov={tipmov}
            meses={meses}
          />
        )}
      </main>
    </div>
  );
}

export default App;

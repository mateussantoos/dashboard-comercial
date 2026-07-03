import { useEffect, useMemo, useState } from "react";

import { useSankhya } from "@/contexts/sankhya-context";
import type { TipMov } from "@/services/representantes/types";
import { useRepresentantes } from "@/hooks/use-dashboard-data";
import { useLocalStorage } from "@/hooks/use-local-storage";

import { Sidebar, type Tela } from "@/components/dashboard/sidebar";
import { TelaGerencial } from "@/components/dashboard/tela-gerencial";
import { TelaRepresentante } from "@/components/dashboard/tela-representante";
import { TelaComparar } from "@/components/dashboard/tela-comparar";

const MODO_DEMO =
  import.meta.env.DEV && typeof window.executeQuery !== "function";

const TODOS_MESES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

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

  // Dentro do Sankhya, expande o componente para tela cheia (no-op no dev).
  useEffect(() => {
    void sankhya.removeFrame({
      instance: "DASH_COMERCIAL",
      initialPage: "index.jsp",
    });
  }, [sankhya]);

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

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        {tela === "gerencial" ? (
          <TelaGerencial
            anoAtual={anoAtual}
            anoAnterior={anoAnterior}
            meses={meses}
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

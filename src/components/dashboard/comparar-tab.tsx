import { useState } from "react";

import type { Representante, TipMov } from "@/services/representantes/types";
import { useComparativo } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";
import { GraficoCard } from "./panel-cards";
import { RepresentanteMultiSelect } from "./representante-select";
import { ChartComparativo } from "./charts";
import { metricaLabel } from "./tipmov-toggle";

interface CompararTabProps {
  representantes: Representante[];
  tipmov: TipMov;
  loadingReps: boolean;
}

export function CompararTab({
  representantes,
  tipmov,
  loadingReps,
}: CompararTabProps) {
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const { data, loading } = useComparativo(selecionados, tipmov);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <RepresentanteMultiSelect
          representantes={representantes}
          values={selecionados}
          onChange={setSelecionados}
          loading={loadingReps}
          max={5}
        />
        <span className="text-xs text-muted-foreground">
          Selecione até 5 representantes para comparar.
        </span>
      </div>

      <GraficoCard
        title="Comparativo de faturamento anual"
        subtitle={`Base: ${metricaLabel(tipmov)}`}
        jpgFileName="comparativo_representantes"
      >
        {selecionados.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Escolha ao menos um representante para ver o comparativo.
          </p>
        ) : loading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : (
          <ChartComparativo data={data} representantes={representantes} />
        )}
      </GraficoCard>
    </div>
  );
}

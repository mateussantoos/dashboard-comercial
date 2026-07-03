import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Crown,
  Receipt,
  TrendingUp,
} from "lucide-react";

import type { Representante, TipMov } from "@/services/representantes/types";
import { useComparativo } from "@/hooks/use-dashboard-data";
import { formatBRL, formatInt } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "./kpi-card";
import { GraficoCard, TabelaGraficoCard } from "./panel-cards";
import { RepresentanteMultiSelect } from "./representante-select";
import { ChartComparativo, CHART_COLORS } from "./charts";
import { metricaLabel } from "./tipmov-toggle";
import type { Coluna } from "./generic-table";
import type { SerieBar } from "./generic-bar-chart";

interface CompRow {
  ano: number;
  [key: string]: number | string;
}

interface TelaCompararProps {
  representantes: Representante[];
  loadingReps: boolean;
  tipmov: TipMov;
  meses: number[];
  anoAtual: number;
  anoAnterior: number;
}

export function TelaComparar({
  representantes,
  loadingReps,
  tipmov,
  anoAtual,
  anoAnterior,
}: TelaCompararProps) {
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const { data, loading } = useComparativo(selecionados, tipmov);
  const metrica = metricaLabel(tipmov);

  const nomeDe = (cv: number) =>
    representantes.find((r) => r.codvend === cv)?.nome ?? `#${cv}`;

  // --- Preparar dados para tabela comparativa ---
  const { rows, colunas, series, kpis } = useMemo(() => {
    if (!data.length || !selecionados.length) {
      return { rows: [] as CompRow[], colunas: [] as Coluna<CompRow>[], series: [] as SerieBar[], kpis: null };
    }

    const anos = [...new Set(data.map((d) => d.ano))].sort((a, b) => a - b);
    const codvends = [...new Set(data.map((d) => d.codvend))];

    // Construir linhas: uma por ano, com uma coluna por representante
    const tableRows: CompRow[] = anos.map((ano) => {
      const row: CompRow = { ano };
      for (const cv of codvends) {
        const found = data.find((d) => d.ano === ano && d.codvend === cv);
        row[`v${cv}`] = found ? found.total : 0;
      }
      return row;
    });

    // Colunas
    const cols: Coluna<CompRow>[] = [
      { key: "ano" as keyof CompRow & string, label: "Ano" },
      ...codvends.map((cv) => ({
        key: `v${cv}` as keyof CompRow & string,
        label: nomeDe(cv),
        align: "right" as const,
        format: (v: unknown) => formatBRL(Number(v)),
        footer: formatBRL(
          tableRows.reduce((s, r) => s + Number(r[`v${cv}`] ?? 0), 0)
        ),
      })),
    ];

    // Séries para gráfico
    const barSeries: SerieBar[] = codvends.map((cv, i) => ({
      key: `v${cv}`,
      label: nomeDe(cv),
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

    // KPIs
    const totalGeral = data.reduce((s, d) => s + d.total, 0);
    const totalAnoAtual = data
      .filter((d) => d.ano === anoAtual)
      .reduce((s, d) => s + d.total, 0);
    const totalAnoAnterior = data
      .filter((d) => d.ano === anoAnterior)
      .reduce((s, d) => s + d.total, 0);

    // Melhor representante (por total geral)
    const porRep = new Map<number, number>();
    for (const d of data) {
      porRep.set(d.codvend, (porRep.get(d.codvend) ?? 0) + d.total);
    }
    let melhorCv = selecionados[0];
    let melhorVal = 0;
    for (const [cv, total] of porRep) {
      if (total > melhorVal) {
        melhorCv = cv;
        melhorVal = total;
      }
    }

    const delta =
      totalAnoAnterior > 0
        ? ((totalAnoAtual / totalAnoAnterior) - 1) * 100
        : null;

    return {
      rows: tableRows,
      colunas: cols,
      series: barSeries,
      kpis: {
        totalGeral,
        totalAnoAtual,
        delta,
        qtdSelecionados: selecionados.length,
        melhor: nomeDe(melhorCv),
      },
    };
  }, [data, selecionados, anoAtual, anoAnterior, representantes]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Comparar Representantes
          </h2>
          <p className="text-sm text-muted-foreground">
            Base: {metrica} · Selecione até 5 representantes
          </p>
        </div>
        <RepresentanteMultiSelect
          representantes={representantes}
          values={selecionados}
          onChange={setSelecionados}
          loading={loadingReps}
          max={5}
        />
      </div>

      {selecionados.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border bg-card p-12 text-center shadow-sm">
          <div>
            <TrendingUp className="mx-auto mb-3 size-10 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">Selecione representantes</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Escolha até 5 representantes no seletor acima para ver o
              comparativo completo com KPIs, gráfico e tabela.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          {kpis ? (
            <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title={`Total ${metrica.toLowerCase()}`}
                value={formatBRL(kpis.totalGeral)}
                hint="todo o período"
                icon={<CircleDollarSign className="size-4" />}
              />
              <KpiCard
                title={`Total em ${anoAtual}`}
                value={formatBRL(kpis.totalAnoAtual)}
                delta={kpis.delta}
                deltaLabel={`vs ${anoAnterior}`}
                icon={<TrendingUp className="size-4" />}
              />
              <KpiCard
                title="Representantes"
                value={formatInt(kpis.qtdSelecionados)}
                hint="selecionados"
                icon={<Receipt className="size-4" />}
              />
              <KpiCard
                title="Melhor representante"
                value={kpis.melhor}
                hint="maior total geral"
                icon={<Crown className="size-4" />}
              />
            </div>
          ) : null}

          {/* Gráfico comparativo */}
          <GraficoCard
            title="Evolução anual"
            subtitle={`${metrica} — ${selecionados.length} representante(s)`}
            jpgFileName="comparativo_representantes"
            fill
          >
            <ChartComparativo data={data} representantes={representantes} />
          </GraficoCard>

          {/* Tabela comparativa */}
          {rows.length > 0 ? (
            <TabelaGraficoCard<CompRow>
              title="Tabela comparativa"
              subtitle={`${metrica} por ano`}
              data={rows}
              colunas={colunas}
              rowKey={(r) => r.ano}
              showFooter
              categoryKey="ano"
              series={series}
              csvFileName="comparativo_representantes"
              storageKey="comp_reps"
              fill
            />
          ) : null}
        </>
      )}
    </div>
  );
}

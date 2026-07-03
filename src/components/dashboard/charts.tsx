import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatBRL, formatBRLCompact, MESES_PT } from "@/lib/format";
import type {
  ComparativoPonto,
  Representante,
  VendaAno,
  VendaAnoMes,
  VendaUF,
} from "@/services/representantes/types";

/** Paleta categórica (tokens definidos em index.css). */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const compactTick = (v: number | string) => formatBRLCompact(Number(v));
const brlTooltip = (v: unknown) => formatBRL(Number(v));

/** Barras: total por ano (série única). */
export function ChartVendasAno({
  data,
  metrica,
}: {
  data: VendaAno[];
  metrica: string;
}) {
  const config = {
    total: { label: metrica, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <BarChart data={data} margin={{ left: 8, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="ano"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={compactTick}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={brlTooltip} />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

/** Linhas: uma série por ano ao longo dos 12 meses (sazonalidade). */
export function ChartAnoMes({ data }: { data: VendaAnoMes[] }) {
  const anos = [...new Set(data.map((d) => d.ano))].sort((a, b) => a - b);
  const meses = MESES_PT.slice(1);

  const rows = meses.map((nome, idx) => {
    const mes = idx + 1;
    const row: Record<string, number | string> = { mes: nome };
    for (const ano of anos) {
      const found = data.find((d) => d.ano === ano && d.mes === mes);
      row[String(ano)] = found ? found.total : 0;
    }
    return row;
  });

  const config = Object.fromEntries(
    anos.map((ano, i) => [
      String(ano),
      { label: String(ano), color: CHART_COLORS[i % CHART_COLORS.length] },
    ])
  ) as ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <LineChart data={rows} margin={{ left: 8, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={compactTick}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={brlTooltip} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {anos.map((ano) => (
          <Line
            key={ano}
            dataKey={String(ano)}
            type="monotone"
            stroke={`var(--color-${ano})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

/** Linhas: comparativo de faturamento anual entre representantes. */
export function ChartComparativo({
  data,
  representantes,
}: {
  data: ComparativoPonto[];
  representantes: Representante[];
}) {
  const codvends = [...new Set(data.map((d) => d.codvend))];
  const anos = [...new Set(data.map((d) => d.ano))].sort((a, b) => a - b);

  const nomeDe = (cv: number) =>
    representantes.find((r) => r.codvend === cv)?.nome ?? `#${cv}`;

  const rows = anos.map((ano) => {
    const row: Record<string, number> = { ano };
    for (const cv of codvends) {
      const f = data.find((d) => d.ano === ano && d.codvend === cv);
      row[`v${cv}`] = f ? f.total : 0;
    }
    return row;
  });

  const config = Object.fromEntries(
    codvends.map((cv, i) => [
      `v${cv}`,
      { label: nomeDe(cv), color: CHART_COLORS[i % CHART_COLORS.length] },
    ])
  ) as ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <LineChart data={rows} margin={{ left: 8, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="ano" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={72}
          tickFormatter={compactTick}
        />
        <ChartTooltip content={<ChartTooltipContent formatter={brlTooltip} />} />
        <ChartLegend content={<ChartLegendContent />} />
        {codvends.map((cv) => (
          <Line
            key={cv}
            dataKey={`v${cv}`}
            type="monotone"
            stroke={`var(--color-v${cv})`}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

/** Barras horizontais: total por UF. */
export function ChartUF({ data }: { data: VendaUF[] }) {
  const config = {
    total: { label: "Total", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-full w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" dataKey="total" hide />
        <YAxis
          type="category"
          dataKey="uf"
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={brlTooltip} />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

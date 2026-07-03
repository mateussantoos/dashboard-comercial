import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { formatBRL, formatBRLCompact } from "@/lib/format";

/** Série (barra) do gráfico genérico. */
export interface SerieBar {
  key: string;
  label: string;
  color: string;
}

interface GenericBarChartProps {
  data: Record<string, string | number>[];
  categoryKey: string;
  series: SerieBar[];
  horizontal?: boolean;
  height?: number;
  /** Ao clicar em uma barra, abre o detalhamento da linha correspondente. */
  onBarClick?: (row: Record<string, unknown>) => void;
}

const compactTick = (v: number | string) => formatBRLCompact(Number(v));
const brlTooltip = (v: unknown) => formatBRL(Number(v));

/**
 * Gráfico de barras genérico (uma ou mais séries agrupadas), reutilizado por
 * todos os cards que permitem alternar da tabela para o gráfico.
 */
export function GenericBarChart({
  data,
  categoryKey,
  series,
  horizontal = false,
  onBarClick,
}: GenericBarChartProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = onBarClick
    ? (entry: any) => onBarClick(entry?.payload ?? entry)
    : undefined;
  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) as ChartConfig;

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-full w-full"
    >
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ left: 8, right: 12, top: 8, bottom: 4 }}
      >
        <CartesianGrid
          vertical={horizontal}
          horizontal={!horizontal}
        />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={compactTick} hide />
            <YAxis
              type="category"
              dataKey={categoryKey}
              tickLine={false}
              axisLine={false}
              width={64}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={categoryKey}
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
          </>
        )}
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={brlTooltip} />}
        />
        {series.length > 1 ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            fill={`var(--color-${s.key})`}
            radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            onClick={handleClick}
            className={onBarClick ? "cursor-pointer" : undefined}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

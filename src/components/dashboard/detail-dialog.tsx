import * as React from "react";
import {
  CircleDollarSign,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { formatBRL, formatBRLCompact, formatInt } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CampoDetalhe {
  label: string;
  valor: React.ReactNode;
}

/** Registro individual que compõe o dado agregado (drill-down). */
export interface RegistroDetalhe {
  id: string | number;
  /** Descrição principal (nome do cliente, produto, etc.) */
  descricao: string;
  /** Valor monetário */
  valor: number;
  /** Data ou período */
  periodo: string;
  /** Campo auxiliar (UF, tipo, etc.) */
  extra?: string;
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Campos resumidos (KPIs) — exibidos no topo como cards. */
  campos: CampoDetalhe[];
  /** Registros individuais que compõem o dado. */
  registros?: RegistroDetalhe[];
}

const compactTick = (v: number | string) => formatBRLCompact(Number(v));
const brlTooltip = (v: unknown) => formatBRL(Number(v));

/**
 * Dialog de detalhamento v2:
 * 1. KPIs resumo no topo
 * 2. Gráfico de linhas mostrando flutuação de valores
 * 3. Tabela completa com todos os registros
 */
export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  campos,
  registros = [],
}: DetailDialogProps) {
  // Derivar KPIs dos registros
  const totalValor = registros.reduce((s, r) => s + r.valor, 0);
  const qtdRegistros = registros.length;
  const ticketMedio = qtdRegistros > 0 ? totalValor / qtdRegistros : 0;
  const maiorRegistro = registros.reduce<RegistroDetalhe | null>(
    (best, r) => (!best || r.valor > best.valor ? r : best),
    null
  );

  // Dados para gráfico de linha (agrupar por período)
  const chartData = React.useMemo(() => {
    if (!registros.length) return [];
    const porPeriodo = new Map<string, number>();
    for (const r of registros) {
      porPeriodo.set(r.periodo, (porPeriodo.get(r.periodo) ?? 0) + r.valor);
    }
    return [...porPeriodo.entries()]
      .map(([periodo, valor]) => ({ periodo, valor }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [registros]);

  const chartConfig: ChartConfig = {
    valor: { label: "Valor", color: "var(--chart-1)" },
  };

  const hasRegistros = registros.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
          {/* KPIs resumo */}
          {hasRegistros ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiMini
                label="Total"
                value={formatBRL(totalValor)}
                icon={<CircleDollarSign className="size-3.5" />}
              />
              <KpiMini
                label="Registros"
                value={formatInt(qtdRegistros)}
                icon={<Receipt className="size-3.5" />}
              />
              <KpiMini
                label="Ticket médio"
                value={formatBRL(ticketMedio)}
                icon={<TrendingUp className="size-3.5" />}
              />
              <KpiMini
                label="Maior valor"
                value={maiorRegistro ? formatBRL(maiorRegistro.valor) : "—"}
                icon={<TrendingUp className="size-3.5" />}
              />
            </div>
          ) : (
            /* Fallback: mostrar campos como KPIs quando não há registros */
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {campos.map((c) => (
                <KpiMini key={c.label} label={c.label} value={c.valor} />
              ))}
            </div>
          )}

          {/* Gráfico de linhas */}
          {chartData.length > 1 ? (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Flutuação de valores
              </p>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[180px] w-full"
              >
                <LineChart data={chartData} margin={{ left: 8, right: 12, top: 8 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="periodo"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={11}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={72}
                    tickFormatter={compactTick}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={brlTooltip} />}
                  />
                  <Line
                    dataKey="valor"
                    type="monotone"
                    stroke="var(--color-valor)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          ) : null}

          {/* Tabela completa */}
          {hasRegistros ? (
            <div className="rounded-lg border">
              <div className="px-3 py-2 border-b bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground">
                  Registros que compõem este dado ({formatInt(qtdRegistros)})
                </p>
              </div>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>#</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Período</TableHead>
                      {registros.some((r) => r.extra) ? (
                        <TableHead>Info</TableHead>
                      ) : null}
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((r, i) => (
                      <TableRow key={r.id}>
                        <TableCell className="tabular-nums text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {r.descricao}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {r.periodo}
                        </TableCell>
                        {registros.some((reg) => reg.extra) ? (
                          <TableCell>{r.extra ?? "—"}</TableCell>
                        ) : null}
                        <TableCell className="text-right tabular-nums font-medium">
                          {formatBRL(r.valor)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function KpiMini({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold tabular-nums truncate">
        {value}
      </div>
    </div>
  );
}

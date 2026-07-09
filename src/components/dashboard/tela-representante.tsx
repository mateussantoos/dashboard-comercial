import { useMemo, useState } from "react";
import {
  BarChart3,
  Calculator,
  CalendarRange,
  CircleDollarSign,
  Receipt,
  TriangleAlert,
} from "lucide-react";

import type {
  Representante,
  TipMov,
  TopItem,
  VendaAno,
  VendaUF,
} from "@/services/representantes/types";
import { resumoRepresentante } from "@/services/representantes/analytics";
import { useVendasRepresentante } from "@/hooks/use-dashboard-data";
import { formatBRL, formatInt } from "@/lib/format";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DashboardCard } from "./dashboard-card";
import { CardLoading } from "./card-loading";
import { KpiCard } from "./kpi-card";
import { PctBadge, pctShareCell } from "./pct-badge";
import { RepresentanteCombobox } from "./representante-select";
import { metricaLabel } from "./tipmov-toggle";
import { TabelaGraficoCard, GraficoCard } from "./panel-cards";
import type { Coluna } from "./generic-table";
import { ChartAnoMes, ChartDiaDia, CHART_COLORS } from "./charts";

const brlCell = (v: unknown) => formatBRL(Number(v));
const intCell = (v: unknown) => formatInt(Number(v));
const pctCell = pctShareCell;

interface AnoRow {
  ano: number;
  qtd: number;
  total: number;
  ticket: number;
  part: number;
}
interface UFRow {
  uf: string;
  total: number;
  qtd: number;
  part: number;
}
interface TopRow {
  pos: number;
  codigo: number;
  nome: string;
  qtd: number;
  total: number;
  part: number;
}

interface TelaRepresentanteProps {
  representantes: Representante[];
  loadingReps: boolean;
  tipmov: TipMov;
  meses: number[];
  anoAtual: number;
  anoAnterior: number;
}

export function TelaRepresentante({
  representantes,
  loadingReps,
  tipmov,
  meses,
  anoAtual,
  anoAnterior,
}: TelaRepresentanteProps) {
  const [codvend, setCodvend] = useState<number | null>(null);
  const [anosMes, setAnosMes] = useState(4);

  const { data, loading, error } = useVendasRepresentante(
    codvend,
    tipmov,
    anoAtual,
    anoAnterior,
    anosMes,
    meses
  );

  const metrica = metricaLabel(tipmov);
  const notasLabel = tipmov === "P" ? "pedidos" : "notas";
  const repSelecionado = representantes.find((r) => r.codvend === codvend);
  const resumo = useMemo(
    () => (data ? resumoRepresentante(data.ano) : null),
    [data]
  );
  const carregando = loading || !data;

  // Contexto base do drill-down (notas do representante selecionado).
  const baseCtxRep = { tipmov, meses, codvend: codvend ?? undefined };

  // Comparação YTD (2025 × 2026 até a data de hoje) — comparação justa.
  const ytdAnterior =
    data?.ateData.find((r) => r.ano === anoAnterior)?.total ?? 0;
  const ytdAtual = data?.ateData.find((r) => r.ano === anoAtual)?.total ?? 0;
  const hoje = new Date();
  const ateLabel = `${String(hoje.getDate()).padStart(2, "0")}/${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const anoRows = useMemo<AnoRow[]>(() => toAnoRows(data?.ano ?? []), [data]);
  const ufRows = useMemo<UFRow[]>(() => toUFRows(data?.uf ?? []), [data]);
  const clientesRows = useMemo<TopRow[]>(
    () => toTopRows(data?.topClientes ?? []),
    [data]
  );
  const produtosRows = useMemo<TopRow[]>(
    () => toTopRows(data?.topProdutos ?? []),
    [data]
  );

  const colunasAno = useMemo<Coluna<AnoRow>[]>(() => {
    const totalGeral = anoRows.reduce((s, d) => s + d.total, 0);
    const qtdGeral = anoRows.reduce((s, d) => s + d.qtd, 0);
    return [
      { key: "ano", label: "Ano", footer: "Total" },
      { key: "qtd", label: "Qtd", align: "right", format: intCell, footer: formatInt(qtdGeral) },
      { key: "total", label: metrica, align: "right", format: brlCell, footer: formatBRL(totalGeral) },
      { key: "ticket", label: "Ticket médio", align: "right", format: brlCell, footer: formatBRL(qtdGeral ? totalGeral / qtdGeral : 0) },
      { key: "part", label: "%", align: "right", format: pctCell, footer: "100,0%" },
    ];
  }, [anoRows, metrica]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Por Representante
          </h2>
          <p className="text-sm text-muted-foreground">
            {repSelecionado?.nome ?? "Selecione um representante"} · Base:{" "}
            {metrica}
          </p>
        </div>
        <RepresentanteCombobox
          representantes={representantes}
          value={codvend}
          onChange={setCodvend}
          loading={loadingReps}
        />
      </div>

      {codvend == null ? (
        <EstadoVazio />
      ) : error ? (
        <ErroBox message={error} />
      ) : (
        <>
          <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title={`Total de ${metrica.toLowerCase()}`}
              value={resumo ? formatBRL(resumo.totalPeriodo) : ""}
              hint="todo o período"
              icon={<CircleDollarSign className="size-4" />}
              loading={carregando}
            />
            <KpiCard
              title={`Quantidade de ${notasLabel}`}
              value={resumo ? formatInt(resumo.qtdTotal) : ""}
              hint="documentos emitidos"
              icon={<Receipt className="size-4" />}
              loading={carregando}
            />
            <KpiCard
              title="Ticket médio"
              value={resumo ? formatBRL(resumo.ticketMedio) : ""}
              hint="por documento"
              icon={<Calculator className="size-4" />}
              loading={carregando}
            />
            <CardComparativoAno
              anoAnterior={anoAnterior}
              anoAtual={anoAtual}
              totalAnterior={ytdAnterior}
              totalAtual={ytdAtual}
              ate={ateLabel}
              loading={carregando}
            />
          </div>

          <Tabs defaultValue="geral" className="flex flex-1 flex-col gap-4 min-h-0">
            <TabsList className="shrink-0 flex-wrap">
              <TabsTrigger value="geral">Visão Geral</TabsTrigger>
              <TabsTrigger value="anomes">Ano × Mês</TabsTrigger>
              <TabsTrigger value="diadia">Dia × Dia</TabsTrigger>
              <TabsTrigger value="rankings">UF &amp; Rankings</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="flex-1 min-h-0 flex flex-col">
              {carregando ? (
                <CardSkeleton title={`${metrica} por ano`} />
              ) : (
                <TabelaGraficoCard<AnoRow>
                  title={`${metrica} por ano`}
                  subtitle={repSelecionado?.nome}
                  data={anoRows}
                  colunas={colunasAno}
                  rowKey={(r) => r.ano}
                  showFooter
                  categoryKey="ano"
                  series={[{ key: "total", label: metrica, color: CHART_COLORS[0] }]}
                  csvFileName={`vendas_${repSelecionado?.nome ?? codvend}`}
                  montarDetalhe={(r) => ({
                    titulo: `${repSelecionado?.nome ?? ""} · ${r.ano}`,
                    ctx: { ...baseCtxRep, ano: r.ano },
                  })}
                  fill
                />
              )}
            </TabsContent>

            <TabsContent value="anomes" className="flex-1 min-h-0 flex flex-col">
              {carregando ? (
                <CardSkeleton title="Sazonalidade — Ano × Mês" />
              ) : (
                <GraficoCard
                  title="Sazonalidade — Ano × Mês"
                  subtitle={`Comparativo mensal dos últimos ${anosMes} anos`}
                  jpgFileName={`sazonalidade_${repSelecionado?.nome ?? codvend}`}
                  action={<JanelaAnosSelect value={anosMes} onChange={setAnosMes} />}
                  fill
                >
                  {data.anoMes.length ? (
                    <ChartAnoMes data={data.anoMes} />
                  ) : (
                    <MsgVazia />
                  )}
                </GraficoCard>
              )}
            </TabsContent>

            <TabsContent value="diadia" className="flex-1 min-h-0 flex flex-col">
              {carregando ? (
                <CardSkeleton title="Dia a dia — acumulado no ano" />
              ) : (
                <GraficoCard
                  title="Dia a dia — acumulado no ano"
                  subtitle={`Faturamento acumulado de 01/01 até ${ateLabel} · ${anoAnterior} × ${anoAtual}`}
                  jpgFileName={`dia_a_dia_${repSelecionado?.nome ?? codvend}`}
                  fill
                >
                  {data.dia.length ? (
                    <ChartDiaDia data={data.dia} />
                  ) : (
                    <MsgVazia />
                  )}
                </GraficoCard>
              )}
            </TabsContent>

            <TabsContent value="rankings" className="flex-1 min-h-0 overflow-auto">
              <div className="grid gap-4 lg:grid-cols-2">
                {carregando ? (
                  <>
                    <CardSkeleton title="Vendas por UF" />
                    <CardSkeleton title="Top clientes" />
                  </>
                ) : (
                  <>
                    <TabelaGraficoCard<UFRow>
                      title="Vendas por UF"
                      subtitle="Distribuição geográfica"
                      data={ufRows}
                      colunas={[
                        { key: "uf", label: "UF" },
                        { key: "total", label: "Total", align: "right", format: brlCell },
                        { key: "qtd", label: "Qtd", align: "right", format: intCell },
                        { key: "part", label: "%", align: "right", format: pctCell },
                      ]}
                      rowKey={(r) => r.uf}
                      categoryKey="uf"
                      series={[{ key: "total", label: "Total", color: CHART_COLORS[1] }]}
                      horizontal
                      csvFileName={`uf_${repSelecionado?.nome ?? codvend}`}
                      montarDetalhe={(r) => ({
                        titulo: `UF ${r.uf}`,
                        ctx: { ...baseCtxRep, uf: r.uf, todosAnos: true },
                      })}
                    />

                    <TabelaGraficoCard<TopRow>
                      title="Top clientes"
                      subtitle="Maiores compradores"
                      data={clientesRows}
                      colunas={colunasTop("Cliente")}
                      rowKey={(r) => r.pos}
                      categoryKey="nome"
                      series={[{ key: "total", label: "Total", color: CHART_COLORS[0] }]}
                      horizontal
                      csvFileName={`clientes_${repSelecionado?.nome ?? codvend}`}
                      montarDetalhe={(r) => ({
                        titulo: r.nome,
                        ctx: { ...baseCtxRep, codparc: r.codigo, todosAnos: true },
                      })}
                    />
                  </>
                )}

                <div className="lg:col-span-2">
                  {carregando ? (
                    <CardSkeleton title="Top produtos" />
                  ) : (
                    <TabelaGraficoCard<TopRow>
                      title="Top produtos"
                      subtitle="Itens mais vendidos"
                      data={produtosRows}
                      colunas={colunasTop("Produto")}
                      rowKey={(r) => r.pos}
                      categoryKey="nome"
                      series={[{ key: "total", label: "Total", color: CHART_COLORS[3] }]}
                      horizontal
                      csvFileName={`produtos_${repSelecionado?.nome ?? codvend}`}
                      montarDetalhe={(r) => ({
                        titulo: r.nome,
                        ctx: { ...baseCtxRep, codprod: r.codigo, todosAnos: true },
                      })}
                    />
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function colunasTop(labelNome: string): Coluna<TopRow>[] {
  return [
    { key: "pos", label: "#" },
    { key: "nome", label: labelNome },
    { key: "qtd", label: "Qtd", align: "right", format: intCell },
    { key: "total", label: "Total", align: "right", format: brlCell },
    { key: "part", label: "%", align: "right", format: pctCell },
  ];
}

function toAnoRows(ano: VendaAno[]): AnoRow[] {
  const tot = ano.reduce((s, d) => s + d.total, 0);
  return ano.map((d) => ({
    ano: d.ano,
    qtd: d.qtd,
    total: d.total,
    ticket: d.qtd ? d.total / d.qtd : 0,
    part: tot ? (d.total / tot) * 100 : 0,
  }));
}

function toUFRows(uf: VendaUF[]): UFRow[] {
  const tot = uf.reduce((s, d) => s + d.total, 0);
  return uf.map((d) => ({
    uf: d.uf,
    total: d.total,
    qtd: d.qtd,
    part: tot ? (d.total / tot) * 100 : 0,
  }));
}

function toTopRows(items: TopItem[]): TopRow[] {
  const tot = items.reduce((s, d) => s + d.total, 0);
  return items.map((it, i) => ({
    pos: i + 1,
    codigo: it.codigo,
    nome: it.nome,
    qtd: it.qtd,
    total: it.total,
    part: tot ? (it.total / tot) * 100 : 0,
  }));
}

function JanelaAnosSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger size="sm" className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[2, 3, 4, 5, 6].map((n) => (
          <SelectItem key={n} value={String(n)}>
            {n} anos
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CardSkeleton({ title }: { title: string }) {
  return (
    <DashboardCard title={title} fill>
      <CardLoading />
    </DashboardCard>
  );
}

/** Card comparativo YTD: ano anterior × atual, ambos até a data de hoje. */
function CardComparativoAno({
  anoAnterior,
  anoAtual,
  totalAnterior,
  totalAtual,
  ate,
  loading,
}: {
  anoAnterior: number;
  anoAtual: number;
  totalAnterior: number;
  totalAtual: number;
  ate: string;
  loading: boolean;
}) {
  const delta = totalAnterior ? (totalAtual / totalAnterior - 1) * 100 : null;
  return (
    <DashboardCard
      title={`Faturamento até ${ate}`}
      action={
        <span className="text-muted-foreground">
          <CalendarRange className="size-4" />
        </span>
      }
      innerClassName="flex flex-col justify-center gap-1.5"
    >
      {loading ? (
        <Skeleton className="h-14 w-full" />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {anoAnterior}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {formatBRL(totalAnterior)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              {anoAtual}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatBRL(totalAtual)}
              </span>
              <PctBadge value={delta} />
            </div>
          </div>
        </>
      )}
    </DashboardCard>
  );
}

function EstadoVazio() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border bg-card p-12 text-center shadow-sm">
      <div>
        <BarChart3 className="mx-auto mb-3 size-10 text-muted-foreground/50" />
        <h2 className="text-lg font-medium">Selecione um representante</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Escolha um representante no seletor acima para visualizar os indicadores
          e gráficos de vendas ao longo dos anos.
        </p>
      </div>
    </div>
  );
}

function ErroBox({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <TriangleAlert className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-medium">Erro ao carregar os dados</p>
        <p className="text-destructive/80">{message}</p>
      </div>
    </div>
  );
}

function MsgVazia() {
  return (
    <p className="py-12 text-center text-sm text-muted-foreground">
      Sem dados para o período selecionado.
    </p>
  );
}

import { RotateCw, TriangleAlert } from "lucide-react";

import { formatBRL, formatInt } from "@/lib/format";
import type {
  LinhaComparativa,
  SnapshotAno,
} from "@/services/representantes/types";
import type {
  GerencialData,
  ProntoGerencial,
} from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";
import { GerencialToolbar } from "./gerencial-toolbar";
import type { GerencialControles } from "./gerencial-toolbar";
import { LoadingIndicator } from "./loading-indicator";
import { PctBadge, pctDeltaCell } from "./pct-badge";
import { TabelaGraficoCard } from "./panel-cards";
import type { Coluna } from "./generic-table";
import type { SerieBar } from "./generic-bar-chart";
import { CHART_COLORS } from "./charts";

const pctCell = pctDeltaCell;
const brlCell = (v: unknown) => formatBRL(Number(v));
const intCell = (v: unknown) => formatInt(Number(v));

/** Variação percentual (atual sobre anterior), ou null se não há base. */
function pct(atual: number, anterior: number): number | null {
  return anterior ? (atual / anterior - 1) * 100 : null;
}

const colunasSnapshot: Coluna<SnapshotAno>[] = [
  { key: "ano", label: "Ano" },
  { key: "vendas", label: "Vendas", align: "right", format: brlCell },
  { key: "pctVend", label: "% Vend.", align: "right", format: pctCell },
  { key: "pedidos", label: "Pedidos", align: "right", format: intCell },
  { key: "pctQtd", label: "% Qtd", align: "right", format: pctCell },
];

const serieSnapshot: SerieBar[] = [
  { key: "vendas", label: "Vendas", color: CHART_COLORS[0] },
];

interface TotaisComparativo {
  vendAnt: number;
  pedAnt: number;
  vendAtu: number;
  pedAtu: number;
}

function calcTotais(rows: LinhaComparativa[]): TotaisComparativo {
  return rows.reduce<TotaisComparativo>(
    (a, r) => ({
      vendAnt: a.vendAnt + r.vendAnt,
      pedAnt: a.pedAnt + r.pedAnt,
      vendAtu: a.vendAtu + r.vendAtu,
      pedAtu: a.pedAtu + r.pedAtu,
    }),
    { vendAnt: 0, pedAnt: 0, vendAtu: 0, pedAtu: 0 }
  );
}

function colunasComparativo(
  anoAtual: number,
  anoAnterior: number,
  opts: { rotuloLabel: string; comRk?: boolean; totais: TotaisComparativo }
): Coluna<LinhaComparativa>[] {
  const { rotuloLabel, comRk, totais } = opts;
  const cols: Coluna<LinhaComparativa>[] = [];
  if (comRk) {
    cols.push({ key: "rk", label: "#", footer: "" });
  }
  cols.push({ key: "rotulo", label: rotuloLabel, footer: "Total" });
  cols.push({ key: "vendAnt", label: `Vend. ${anoAnterior}`, align: "right", format: brlCell, footer: formatBRL(totais.vendAnt) });
  cols.push({ key: "pedAnt", label: `Ped. ${anoAnterior}`, align: "right", format: intCell, footer: formatInt(totais.pedAnt) });
  cols.push({ key: "vendAtu", label: `Vend. ${anoAtual}`, align: "right", format: brlCell, footer: formatBRL(totais.vendAtu) });
  cols.push({ key: "pedAtu", label: `Ped. ${anoAtual}`, align: "right", format: intCell, footer: formatInt(totais.pedAtu) });
  cols.push({ key: "pctVend", label: "% Vend.", align: "right", format: pctCell, footer: <PctBadge value={pct(totais.vendAtu, totais.vendAnt)} /> });
  cols.push({ key: "pctPed", label: "% Ped.", align: "right", format: pctCell, footer: <PctBadge value={pct(totais.pedAtu, totais.pedAnt)} /> });
  return cols;
}

function serieComparativo(anoAtual: number, anoAnterior: number): SerieBar[] {
  return [
    { key: "vendAnt", label: String(anoAnterior), color: CHART_COLORS[2] },
    { key: "vendAtu", label: String(anoAtual), color: CHART_COLORS[0] },
  ];
}

const linhaKey = (row: LinhaComparativa) =>
  `${row.rotulo}-${row.codigo ?? row.ordem ?? ""}`;

interface TelaGerencialProps {
  anoAtual: number;
  anoAnterior: number;
  meses: number[];
  data: GerencialData;
  pronto: ProntoGerencial;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  controles: GerencialControles;
}

export function TelaGerencial({
  anoAtual,
  anoAnterior,
  meses,
  data,
  pronto,
  loading,
  error,
  onRetry,
  controles,
}: TelaGerencialProps) {
  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-medium">Erro ao carregar os dados</p>
            <p className="text-destructive/80">{error}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="size-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  const serieComp = serieComparativo(anoAtual, anoAnterior);

  const subtituloAnos = `${anoAnterior} × ${anoAtual}`;
  // Drill sempre sobre faturamento (a visão gerencial usa TIPMOV='V').
  const baseCtx = { tipmov: "V" as const, meses, anoAtual, anoAnterior };

  const colsUF = colunasComparativo(anoAtual, anoAnterior, {
    rotuloLabel: "UF",
    comRk: true,
    totais: calcTotais(data.uf),
  });
  const colsRep = colunasComparativo(anoAtual, anoAnterior, {
    rotuloLabel: "Representante",
    comRk: true,
    totais: calcTotais(data.representantes),
  });
  const colsMensal = colunasComparativo(anoAtual, anoAnterior, {
    rotuloLabel: "Mês",
    totais: calcTotais(data.mensal),
  });

  const snapshots: {
    titulo: string;
    data: SnapshotAno[];
    pronto: boolean;
  }[] = [
    { titulo: "Ontem", data: data.ontem, pronto: pronto.ontem },
    { titulo: "Hoje", data: data.hoje, pronto: pronto.hoje },
    { titulo: "Mês atual", data: data.mes, pronto: pronto.mes },
    { titulo: "Ano", data: data.ano, pronto: pronto.ano },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <LoadingIndicator show={loading} />
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Visão Gerencial
          </h2>
          <p className="text-sm text-muted-foreground">
            Comparativo {anoAnterior} × {anoAtual} — faturamento consolidado
          </p>
        </div>
        <GerencialToolbar {...controles} />
      </div>

      {/* Recortes por ano — preenche proporcionalmente */}
      <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" style={{ minHeight: 0 }}>
        {snapshots.map((s) =>
          s.pronto ? (
            <TabelaGraficoCard<SnapshotAno>
              key={s.titulo}
              title={s.titulo}
              subtitle="Vendas por ano · todos os anos"
              data={s.data}
              colunas={colunasSnapshot}
              rowKey={(r) => r.ano}
              categoryKey="ano"
              series={serieSnapshot}
              csvFileName={`gerencial_${s.titulo.toLowerCase()}`}
              storageKey={`ger_snap_${s.titulo}`}
              montarDetalhe={(r) => ({
                titulo: `${s.titulo} · ${r.ano}`,
                ctx: { ...baseCtx, ano: r.ano },
              })}
              fill
            />
          ) : (
            <CardSkeleton
              key={s.titulo}
              title={s.titulo}
              subtitle="Vendas por ano · todos os anos"
            />
          )
        )}
      </div>

      {/* UF, Representantes e Mensal (linha inferior — 3 colunas) */}
      <div className="grid flex-1 gap-4 lg:grid-cols-3" style={{ minHeight: 0 }}>
        {pronto.uf ? (
          <TabelaGraficoCard<LinhaComparativa>
            title="Vendas por UF"
            subtitle={`Ranking de estados · ${subtituloAnos}`}
            data={data.uf}
            colunas={colsUF}
            rowKey={linhaKey}
            showFooter
            categoryKey="rotulo"
            series={serieComp}
            horizontal
            csvFileName="gerencial_uf"
            storageKey="ger_uf"
            montarDetalhe={(r) => ({
              titulo: `UF ${r.rotulo}`,
              ctx: { ...baseCtx, uf: r.rotulo },
            })}
            fill
          />
        ) : (
          <CardSkeleton title="Vendas por UF" subtitle={subtituloAnos} />
        )}
        {pronto.representantes ? (
          <TabelaGraficoCard<LinhaComparativa>
            title="Vendas por representante"
            subtitle={`Evolução por representante · ${subtituloAnos}`}
            data={data.representantes}
            colunas={colsRep}
            rowKey={linhaKey}
            showFooter
            categoryKey="rotulo"
            series={serieComp}
            horizontal
            csvFileName="gerencial_representantes"
            storageKey="ger_representantes"
            montarDetalhe={(r) => ({
              titulo: r.rotulo,
              ctx: { ...baseCtx, codvend: r.codigo },
            })}
            fill
          />
        ) : (
          <CardSkeleton
            title="Vendas por representante"
            subtitle={subtituloAnos}
          />
        )}
        {pronto.mensal ? (
          <TabelaGraficoCard<LinhaComparativa>
            title="Vendas por mês"
            subtitle={`Sazonalidade mensal · ${subtituloAnos}`}
            data={data.mensal}
            colunas={colsMensal}
            rowKey={linhaKey}
            showFooter
            categoryKey="rotulo"
            series={serieComp}
            csvFileName="gerencial_mensal"
            storageKey="ger_mensal"
            montarDetalhe={(r) => ({
              titulo: r.rotulo,
              ctx: { ...baseCtx, mes: r.ordem },
            })}
            fill
          />
        ) : (
          <CardSkeleton title="Vendas por mês" subtitle={subtituloAnos} />
        )}
      </div>
    </div>
  );
}

function CardSkeleton({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <DashboardCard title={title} subtitle={subtitle} fill>
      <Skeleton className="h-full w-full" />
    </DashboardCard>
  );
}

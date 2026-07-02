import { TriangleAlert } from "lucide-react";

import { formatBRL, formatInt, formatSignedPct } from "@/lib/format";
import type {
  LinhaComparativa,
  SnapshotAno,
} from "@/services/representantes/types";
import { useGerencial } from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";
import { TabelaGraficoCard, CARD_BODY_HEIGHT } from "./panel-cards";
import type { Coluna } from "./generic-table";
import type { SerieBar } from "./generic-bar-chart";
import { CHART_COLORS } from "./charts";

const pctCell = (v: unknown) => (v == null ? "—" : formatSignedPct(Number(v)));
const brlCell = (v: unknown) => formatBRL(Number(v));
const intCell = (v: unknown) => formatInt(Number(v));

const colunasSnapshot: Coluna<SnapshotAno>[] = [
  { key: "ano", label: "Ano" },
  { key: "vendas", label: "Vendas", align: "right", format: brlCell },
  { key: "pedidos", label: "Pedidos", align: "right", format: intCell },
  { key: "pctVend", label: "% Vend.", align: "right", format: pctCell },
];

const serieSnapshot: SerieBar[] = [
  { key: "vendas", label: "Vendas", color: CHART_COLORS[0] },
];

function colunasComparativo(
  anoAtual: number,
  anoAnterior: number
): Coluna<LinhaComparativa>[] {
  return [
    { key: "rotulo", label: "Rótulo" },
    { key: "vendAnt", label: `Vend. ${anoAnterior}`, align: "right", format: brlCell },
    { key: "pedAnt", label: `Ped. ${anoAnterior}`, align: "right", format: intCell },
    { key: "vendAtu", label: `Vend. ${anoAtual}`, align: "right", format: brlCell },
    { key: "pedAtu", label: `Ped. ${anoAtual}`, align: "right", format: intCell },
    { key: "pctVend", label: "% Vend.", align: "right", format: pctCell },
  ];
}

function serieComparativo(anoAtual: number, anoAnterior: number): SerieBar[] {
  return [
    { key: "vendAnt", label: String(anoAnterior), color: CHART_COLORS[2] },
    { key: "vendAtu", label: String(anoAtual), color: CHART_COLORS[0] },
  ];
}

const linhaKey = (row: LinhaComparativa) =>
  `${row.rotulo}-${row.codigo ?? row.ordem ?? ""}`;

const rotuloComo = (
  cols: Coluna<LinhaComparativa>[],
  label: string
): Coluna<LinhaComparativa>[] =>
  cols.map((c) => (c.key === "rotulo" ? { ...c, label } : c));

interface TelaGerencialProps {
  anoAtual: number;
  anoAnterior: number;
  meses: number[];
}

export function TelaGerencial({
  anoAtual,
  anoAnterior,
  meses,
}: TelaGerencialProps) {
  const { data, loading, error } = useGerencial(anoAtual, anoAnterior, meses);

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-medium">Erro ao carregar os dados</p>
          <p className="text-destructive/80">{error}</p>
        </div>
      </div>
    );
  }

  const carregando = loading || !data;
  const colsComp = colunasComparativo(anoAtual, anoAnterior);
  const serieComp = serieComparativo(anoAtual, anoAnterior);

  const snapshots: { titulo: string; data: SnapshotAno[] }[] = data
    ? [
        { titulo: "Ontem", data: data.ontem },
        { titulo: "Hoje", data: data.hoje },
        { titulo: "Mês atual", data: data.mes },
        { titulo: "Ano", data: data.ano },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Visão Gerencial
        </h2>
        <p className="text-sm text-muted-foreground">
          Comparativo {anoAnterior} × {anoAtual} — faturamento consolidado
        </p>
      </div>

      {/* Recortes por ano */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {carregando
          ? ["Ontem", "Hoje", "Mês atual", "Ano"].map((t) => (
              <CardSkeleton key={t} title={t} />
            ))
          : snapshots.map((s) => (
              <TabelaGraficoCard<SnapshotAno>
                key={s.titulo}
                title={s.titulo}
                subtitle="Vendas por ano"
                data={s.data}
                colunas={colunasSnapshot}
                rowKey={(r) => r.ano}
                categoryKey="ano"
                series={serieSnapshot}
                csvFileName={`gerencial_${s.titulo.toLowerCase()}`}
                storageKey={`ger_snap_${s.titulo}`}
              />
            ))}
      </div>

      {/* UF, Representantes e Mensal (linha inferior — 3 colunas, como no BI) */}
      <div className="grid gap-4 lg:grid-cols-3">
        {carregando ? (
          <>
            <CardSkeleton title="Vendas por UF" />
            <CardSkeleton title="Vendas por representante" />
            <CardSkeleton title="Vendas por mês" />
          </>
        ) : (
          <>
            <TabelaGraficoCard<LinhaComparativa>
              title="Vendas por UF"
              subtitle="Ranking de estados"
              data={data.uf}
              colunas={rotuloComo(colsComp, "UF")}
              rowKey={linhaKey}
              categoryKey="rotulo"
              series={serieComp}
              horizontal
              csvFileName="gerencial_uf"
              storageKey="ger_uf"
            />
            <TabelaGraficoCard<LinhaComparativa>
              title="Vendas por representante"
              subtitle="Evolução por representante"
              data={data.representantes}
              colunas={rotuloComo(colsComp, "Representante")}
              rowKey={linhaKey}
              categoryKey="rotulo"
              series={serieComp}
              horizontal
              csvFileName="gerencial_representantes"
              storageKey="ger_representantes"
            />
            <TabelaGraficoCard<LinhaComparativa>
              title="Vendas por mês"
              subtitle="Sazonalidade mensal"
              data={data.mensal}
              colunas={rotuloComo(colsComp, "Mês")}
              rowKey={linhaKey}
              categoryKey="rotulo"
              series={serieComp}
              csvFileName="gerencial_mensal"
              storageKey="ger_mensal"
            />
          </>
        )}
      </div>
    </div>
  );
}

function CardSkeleton({ title }: { title: string }) {
  return (
    <DashboardCard title={title} bodyHeight={CARD_BODY_HEIGHT}>
      <Skeleton className="h-full w-full" />
    </DashboardCard>
  );
}

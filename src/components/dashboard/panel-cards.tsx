import * as React from "react";
import { BarChart3, Download, Image, Maximize2, Table } from "lucide-react";

import { downloadCSV } from "@/lib/csv";
import { exportarNodeJpeg } from "@/lib/export-image";
import { useColumnConfig } from "@/hooks/use-column-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardCard } from "./dashboard-card";
import { GenericTable, type Coluna } from "./generic-table";
import { GenericBarChart, type SerieBar } from "./generic-bar-chart";
import { ToolbarButton } from "./toolbar-button";
import { ColumnSettings } from "./column-settings";
import { DetailDialog, type CampoDetalhe } from "./detail-dialog";

/** Altura padrão do corpo dos cards, para padronização visual. */
export const CARD_BODY_HEIGHT = 340;

export { ToolbarButton };

interface TabelaGraficoCardProps<T> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  data: T[];
  colunas: Coluna<T>[];
  rowKey: (row: T, index: number) => React.Key;
  showFooter?: boolean;
  categoryKey: string;
  series: SerieBar[];
  horizontal?: boolean;
  csvFileName: string;
  /** Chave de persistência das colunas (default: csvFileName). */
  storageKey?: string;
  bodyHeight?: number;
  defaultView?: "tabela" | "grafico";
}

/**
 * Card de tabela convertível em gráfico. Barra de ferramentas (canto superior
 * direito): configurar colunas, exportar CSV, alternar tabela/gráfico e
 * maximizar. Clicar em uma linha/barra abre o detalhamento dos dados.
 */
export function TabelaGraficoCard<T>({
  title,
  subtitle,
  data,
  colunas,
  rowKey,
  showFooter = false,
  categoryKey,
  series,
  horizontal = false,
  csvFileName,
  storageKey,
  bodyHeight = CARD_BODY_HEIGHT,
  defaultView = "tabela",
}: TabelaGraficoCardProps<T>) {
  const [view, setView] = React.useState<"tabela" | "grafico">(defaultView);
  const [maxOpen, setMaxOpen] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<T | null>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

  const { config, setConfig, colunasVisiveis, mapa } = useColumnConfig(
    storageKey ?? csvFileName,
    colunas
  );

  function buildCampos(row: T): CampoDetalhe[] {
    return colunas.map((c) => ({
      label: c.label,
      valor: c.format
        ? c.format(row[c.key], row)
        : String(row[c.key] ?? ""),
    }));
  }

  const detalheTitulo = detalhe
    ? String((detalhe as Record<string, unknown>)[categoryKey] ?? "Detalhe")
    : "";

  const chartHeight = Math.max(180, bodyHeight - 16);

  const tabela = () => (
    <GenericTable
      data={data}
      colunas={colunasVisiveis}
      rowKey={rowKey}
      showFooter={showFooter}
      onRowClick={setDetalhe}
    />
  );

  const grafico = (altura: number) => (
    <GenericBarChart
      data={data as unknown as Record<string, string | number>[]}
      categoryKey={categoryKey}
      series={series}
      horizontal={horizontal}
      height={altura}
      onBarClick={(row) => setDetalhe(row as T)}
    />
  );

  const toolbar = (
    <>
      {view === "tabela" ? (
        <>
          <ColumnSettings config={config} setConfig={setConfig} mapa={mapa} />
          <ToolbarButton
            title="Exportar CSV"
            onClick={() =>
              downloadCSV(
                csvFileName,
                data,
                colunasVisiveis.map((c) => ({ key: c.key, label: c.label }))
              )
            }
          >
            <Download />
          </ToolbarButton>
          <ToolbarButton title="Ver gráfico" onClick={() => setView("grafico")}>
            <BarChart3 />
          </ToolbarButton>
        </>
      ) : (
        <>
          <ToolbarButton
            title="Exportar JPG"
            onClick={() => exportarNodeJpeg(innerRef.current, csvFileName)}
          >
            <Image />
          </ToolbarButton>
          <ToolbarButton title="Ver tabela" onClick={() => setView("tabela")}>
            <Table />
          </ToolbarButton>
        </>
      )}
      <ToolbarButton title="Maximizar" onClick={() => setMaxOpen(true)}>
        <Maximize2 />
      </ToolbarButton>
    </>
  );

  return (
    <>
      <DashboardCard
        title={title}
        subtitle={subtitle}
        toolbar={toolbar}
        innerRef={innerRef}
        bodyHeight={bodyHeight}
      >
        {view === "tabela" ? tabela() : grafico(chartHeight)}
      </DashboardCard>

      {/* Maximizar */}
      <Dialog open={maxOpen} onOpenChange={setMaxOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted/40 p-3">
            {view === "tabela" ? tabela() : grafico(460)}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhamento da linha/barra */}
      <DetailDialog
        open={detalhe != null}
        onOpenChange={(o) => !o && setDetalhe(null)}
        title={detalheTitulo}
        subtitle="Dados que compõem esta linha"
        campos={detalhe ? buildCampos(detalhe) : []}
      />
    </>
  );
}

interface GraficoCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  jpgFileName: string;
  action?: React.ReactNode;
  bodyHeight?: number;
  children: React.ReactNode;
}

/** Card de gráfico puro (sem tabela) com exportar JPG e maximizar. */
export function GraficoCard({
  title,
  subtitle,
  jpgFileName,
  action,
  bodyHeight,
  children,
}: GraficoCardProps) {
  const [maxOpen, setMaxOpen] = React.useState(false);
  const innerRef = React.useRef<HTMLDivElement>(null);

  const toolbar = (
    <>
      <ToolbarButton
        title="Exportar JPG"
        onClick={() => exportarNodeJpeg(innerRef.current, jpgFileName)}
      >
        <Image />
      </ToolbarButton>
      <ToolbarButton title="Maximizar" onClick={() => setMaxOpen(true)}>
        <Maximize2 />
      </ToolbarButton>
    </>
  );

  return (
    <>
      <DashboardCard
        title={title}
        subtitle={subtitle}
        toolbar={toolbar}
        action={action}
        innerRef={innerRef}
        bodyHeight={bodyHeight}
      >
        {children}
      </DashboardCard>

      <Dialog open={maxOpen} onOpenChange={setMaxOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted/40 p-3">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

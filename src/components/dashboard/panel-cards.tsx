import * as React from "react";
import { BarChart3, Download, Image, Maximize2, Table } from "lucide-react";

import { downloadCSV } from "@/lib/csv";
import { exportarNodeJpeg } from "@/lib/export-image";
import { useColumnConfig } from "@/hooks/use-column-config";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardCard } from "./dashboard-card";
import { GenericTable, type Coluna, type SortDir } from "./generic-table";
import { GenericBarChart, type SerieBar } from "./generic-bar-chart";
import { ToolbarButton } from "./toolbar-button";
import { ColumnSettings } from "./column-settings";
import { DetailDialog, type CampoDetalhe, type RegistroDetalhe } from "./detail-dialog";
import { getRegistrosDetalhe } from "@/services/representantes/repository";
import type { DrillContexto } from "@/services/representantes/types";

export { ToolbarButton };

/** Descreve como montar o detalhamento (drill) de uma linha clicada. */
export type MontarDetalhe<T> = (row: T) => { titulo: string; ctx: DrillContexto };

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
  /** Quando true, o card cresce via flex para preencher o container pai. */
  fill?: boolean;
  /**
   * Monta o drill-down da linha clicada: retorna o título e o contexto usado
   * para buscar as notas que compõem exatamente aquele dado.
   */
  montarDetalhe?: MontarDetalhe<T>;
}

/**
 * Card de tabela convertível em gráfico. Barra de ferramentas (canto superior
 * direito): configurar colunas, exportar CSV, alternar tabela/gráfico e
 * maximizar. Clicar em uma linha/barra abre o detalhamento dos dados.
 * Suporta ordenação por coluna (chevrons no header), persistida no navegador.
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
  bodyHeight,
  defaultView = "tabela",
  fill = false,
  montarDetalhe,
}: TabelaGraficoCardProps<T>) {
  const [view, setView] = React.useState<"tabela" | "grafico">(defaultView);
  const [maxOpen, setMaxOpen] = React.useState(false);
  const [detalheRow, setDetalheRow] = React.useState<T | null>(null);
  const [detalheReq, setDetalheReq] = React.useState<{
    titulo: string;
    ctx: DrillContexto;
  } | null>(null);
  const [registros, setRegistros] = React.useState<RegistroDetalhe[]>([]);
  const [loadingReg, setLoadingReg] = React.useState(false);
  const innerRef = React.useRef<HTMLDivElement>(null);

  function abrirDetalhe(row: T) {
    setDetalheRow(row);
    setDetalheReq(montarDetalhe ? montarDetalhe(row) : null);
  }

  function fecharDetalhe(aberto: boolean) {
    if (aberto) return;
    setDetalheRow(null);
    setDetalheReq(null);
    setRegistros([]);
  }

  React.useEffect(() => {
    if (!detalheRow || !detalheReq) return;
    let cancel = false;
    setLoadingReg(true);
    getRegistrosDetalhe(detalheReq.ctx)
      .then((r) => !cancel && setRegistros(r))
      .catch(() => !cancel && setRegistros([]))
      .finally(() => !cancel && setLoadingReg(false));
    return () => {
      cancel = true;
    };
  }, [detalheRow, detalheReq]);

  const sk = storageKey ?? csvFileName;

  const { config, setConfig, colunasVisiveis, mapa } = useColumnConfig(sk, colunas);

  // --- Ordenação persistida ---
  const [sortState, setSortState] = useLocalStorage<{
    key: string | null;
    dir: SortDir;
  }>(`sort:${sk}`, { key: null, dir: "asc" });

  const sortedData = React.useMemo(() => {
    if (!sortState.key) return data;
    const key = sortState.key as keyof T;
    const dir = sortState.dir === "asc" ? 1 : -1;
    return [...data].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb), "pt-BR") * dir;
    });
  }, [data, sortState]);

  function handleSort(key: string, dir: SortDir) {
    setSortState({ key, dir });
  }

  function buildCampos(row: T): CampoDetalhe[] {
    return colunas.map((c) => ({
      label: c.label,
      valor: c.format
        ? c.format(row[c.key], row)
        : String(row[c.key] ?? ""),
    }));
  }

  const detalheTituloFallback = detalheRow
    ? String((detalheRow as Record<string, unknown>)[categoryKey] ?? "Detalhe")
    : "";

  const tabela = (d: T[] = sortedData) => (
    <GenericTable
      data={d}
      colunas={colunasVisiveis}
      rowKey={rowKey}
      showFooter={showFooter}
      onRowClick={abrirDetalhe}
      sortKey={sortState.key}
      sortDir={sortState.dir}
      onSort={handleSort}
    />
  );

  const grafico = () => (
    <GenericBarChart
      data={sortedData as unknown as Record<string, string | number>[]}
      categoryKey={categoryKey}
      series={series}
      horizontal={horizontal}
      onBarClick={(row) => abrirDetalhe(row as T)}
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
                sortedData,
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
        fill={fill}
      >
        {view === "tabela" ? tabela() : grafico()}
      </DashboardCard>

      {/* Maximizar */}
      <Dialog open={maxOpen} onOpenChange={setMaxOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
          </DialogHeader>
          <div className="max-h-[75vh] overflow-auto rounded-lg border bg-muted/40 p-3">
            {view === "tabela" ? tabela() : <div className="h-[60vh]">{grafico()}</div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detalhamento da linha/barra (drill-down) */}
      <DetailDialog
        open={detalheRow != null}
        onOpenChange={fecharDetalhe}
        title={detalheReq?.titulo ?? detalheTituloFallback}
        subtitle="Dados que compõem esta linha"
        campos={detalheRow ? buildCampos(detalheRow) : []}
        registros={registros}
        loading={loadingReg}
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
  fill?: boolean;
  children: React.ReactNode;
}

/** Card de gráfico puro (sem tabela) com exportar JPG e maximizar. */
export function GraficoCard({
  title,
  subtitle,
  jpgFileName,
  action,
  bodyHeight,
  fill = false,
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
        fill={fill}
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

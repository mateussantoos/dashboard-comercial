import * as React from "react";
import { BarChart3, Download, Image, Maximize2, Table } from "lucide-react";

import { downloadCSV } from "@/lib/csv";
import { formatBRL } from "@/lib/format";
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
  /** Quando true, o card cresce via flex para preencher o container pai. */
  fill?: boolean;
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
}: TabelaGraficoCardProps<T>) {
  const [view, setView] = React.useState<"tabela" | "grafico">(defaultView);
  const [maxOpen, setMaxOpen] = React.useState(false);
  const [detalhe, setDetalhe] = React.useState<T | null>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);

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

  /**
   * Converte todas as linhas do card em registros detalhados para que o
   * DetailDialog possa montar: KPIs + gráfico de linhas + tabela completa.
   */
  function buildRegistros(): RegistroDetalhe[] {
    // Usa a primeira série numérica como valor principal
    const valorKey = series[0]?.key as keyof T | undefined;
    if (!valorKey) return [];

    return sortedData.map((row, i) => {
      const rec = row as Record<string, unknown>;
      const desc = String(rec[categoryKey] ?? `#${i + 1}`);
      const valor = Number(rec[valorKey as string] ?? 0);

      // Tenta usar o categoryKey como período; se for muito curto (UF, sigla) usa o index
      const periodo = desc;

      // Extra: junta outras séries como informação complementar
      const extras = series
        .slice(1)
        .map((s) => {
          const v = Number(rec[s.key] ?? 0);
          return v ? `${s.label}: ${formatBRL(v)}` : null;
        })
        .filter(Boolean);

      return {
        id: `${desc}-${i}`,
        descricao: desc,
        valor,
        periodo,
        extra: extras.length ? extras.join(" | ") : undefined,
      };
    });
  }

  const detalheTitulo = detalhe
    ? String((detalhe as Record<string, unknown>)[categoryKey] ?? "Detalhe")
    : "";


  const tabela = (d: T[] = sortedData) => (
    <GenericTable
      data={d}
      colunas={colunasVisiveis}
      rowKey={rowKey}
      showFooter={showFooter}
      onRowClick={setDetalhe}
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
            {view === "tabela" ? tabela() : grafico()}
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
        registros={detalhe ? buildRegistros() : []}
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

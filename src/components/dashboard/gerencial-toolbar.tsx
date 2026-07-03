import {
  RotateCcw,
  RotateCw,
  Rows2,
  Rows3,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { ToolbarButton } from "./toolbar-button";

export type Densidade = "compacto" | "confortavel";

/** Controles globais de visualização da dashboard. */
export interface GerencialControles {
  densidade: Densidade;
  onToggleDensidade: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReload: () => void;
  onReset: () => void;
}

const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.5;

/**
 * Barra de ações no topo direito da Visão Gerencial: densidade das tabelas,
 * zoom da dashboard, recarregar dados e resetar tudo. Preferências ficam
 * salvas no navegador (ver App).
 */
export function GerencialToolbar({
  densidade,
  onToggleDensidade,
  zoom,
  onZoomIn,
  onZoomOut,
  onReload,
  onReset,
}: GerencialControles) {
  const compacto = densidade === "compacto";
  return (
    <div className="flex items-center gap-1">
      <ToolbarButton
        title={compacto ? "Linhas confortáveis" : "Linhas compactas"}
        onClick={onToggleDensidade}
      >
        {compacto ? <Rows2 /> : <Rows3 />}
      </ToolbarButton>

      <div className="mx-1 flex items-center gap-1">
        <ToolbarButton title="Diminuir zoom" onClick={onZoomOut}>
          <ZoomOut />
        </ToolbarButton>
        <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton title="Aumentar zoom" onClick={onZoomIn}>
          <ZoomIn />
        </ToolbarButton>
      </div>

      <ToolbarButton title="Recarregar dados" onClick={onReload}>
        <RotateCw />
      </ToolbarButton>
      <ToolbarButton title="Resetar tudo (filtros e preferências)" onClick={onReset}>
        <RotateCcw />
      </ToolbarButton>
    </div>
  );
}

export { ZOOM_MIN, ZOOM_MAX };

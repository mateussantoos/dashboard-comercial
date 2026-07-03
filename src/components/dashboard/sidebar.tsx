import {
  GitCompareArrows,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TipMov } from "@/services/representantes/types";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipMovToggle } from "./tipmov-toggle";
import { MesesFilter } from "./meses-filter";

export type Tela = "gerencial" | "representante" | "comparar";

interface SidebarProps {
  tela: Tela;
  onTelaChange: (tela: Tela) => void;
  colapsado: boolean;
  onToggleColapsar: () => void;
  tipmov: TipMov;
  onTipmovChange: (t: TipMov) => void;
  anoAtual: number;
  anoAnterior: number;
  onAnoAtualChange: (a: number) => void;
  onAnoAnteriorChange: (a: number) => void;
  anosDisponiveis: number[];
  meses: number[];
  onMesesChange: (m: number[]) => void;
  modoDemo?: boolean;
}

const NAV: { id: Tela; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "gerencial", label: "Visão Gerencial", icon: LayoutDashboard },
  { id: "representante", label: "Por Representante", icon: UserRound },
  { id: "comparar", label: "Comparar", icon: GitCompareArrows },
];

export function Sidebar({
  tela,
  onTelaChange,
  colapsado,
  onToggleColapsar,
  tipmov,
  onTipmovChange,
  anoAtual,
  anoAnterior,
  onAnoAtualChange,
  onAnoAnteriorChange,
  anosDisponiveis,
  meses,
  onMesesChange,
  modoDemo = false,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col gap-6 border-r bg-card p-3 transition-all",
        colapsado ? "w-16" : "w-72 p-4"
      )}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        {!colapsado ? (
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Dashboard</p>
              <p className="text-xs text-muted-foreground">Comercial</p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleColapsar}
          title={colapsado ? "Expandir" : "Minimizar"}
          aria-label={colapsado ? "Expandir painel" : "Minimizar painel"}
          className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {colapsado ? (
            <PanelLeftOpen className="size-5" />
          ) : (
            <PanelLeftClose className="size-5" />
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const ativo = tela === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTelaChange(item.id)}
              title={item.label}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-md py-2 text-sm font-medium transition-colors",
                colapsado ? "justify-center px-0" : "px-3",
                ativo
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!colapsado ? item.label : null}
            </button>
          );
        })}
      </nav>

      {!colapsado ? (
        <div className="space-y-4 border-t pt-4">
          <p className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Filtros
          </p>

          <div className="space-y-1.5 px-1">
            <label className="text-xs font-medium text-muted-foreground">
              Base de cálculo
            </label>
            <TipMovToggle
              value={tipmov}
              onChange={onTipmovChange}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 px-1">
            <AnoSelect
              label="Ano atual"
              value={anoAtual}
              onChange={onAnoAtualChange}
              anos={anosDisponiveis}
            />
            <AnoSelect
              label="Ano anterior"
              value={anoAnterior}
              onChange={onAnoAnteriorChange}
              anos={anosDisponiveis}
            />
          </div>

          <div className="space-y-1.5 px-1">
            <label className="text-xs font-medium text-muted-foreground">
              Meses
            </label>
            <MesesFilter value={meses} onChange={onMesesChange} />
          </div>
        </div>
      ) : null}

      <div className="mt-auto px-1">
        {modoDemo && !colapsado ? (
          <Badge variant="secondary" className="w-full justify-center">
            Dados de demonstração
          </Badge>
        ) : null}
      </div>
    </aside>
  );
}

function AnoSelect({
  label,
  value,
  onChange,
  anos,
}: {
  label: string;
  value: number;
  onChange: (a: number) => void;
  anos: number[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {anos.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

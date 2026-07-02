import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ColunaConfig } from "@/hooks/use-column-config";
import type { Coluna } from "./generic-table";
import { toolbarButtonClass } from "./toolbar-button";

interface ColumnSettingsProps<T> {
  config: ColunaConfig[];
  setConfig: (config: ColunaConfig[]) => void;
  mapa: Map<string, Coluna<T>>;
}

/** Popover para mostrar/ocultar e reordenar colunas (persistido). */
export function ColumnSettings<T>({
  config,
  setConfig,
  mapa,
}: ColumnSettingsProps<T>) {
  function toggle(key: string) {
    setConfig(
      config.map((c) => (c.key === key ? { ...c, visivel: !c.visivel } : c))
    );
  }

  function move(idx: number, dir: -1 | 1) {
    const alvo = idx + dir;
    if (alvo < 0 || alvo >= config.length) return;
    const proximo = config.slice();
    [proximo[idx], proximo[alvo]] = [proximo[alvo], proximo[idx]];
    setConfig(proximo);
  }

  return (
    <Popover>
      <PopoverTrigger
        className={toolbarButtonClass}
        title="Configurar colunas"
        aria-label="Configurar colunas"
      >
        <SlidersHorizontal />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-2 pb-1.5 text-xs font-medium text-muted-foreground">
          Colunas — visibilidade e ordem
        </p>
        <div className="space-y-0.5">
          {config.map((c, i) => {
            const col = mapa.get(c.key);
            return (
              <div
                key={c.key}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
              >
                <Checkbox
                  id={`col-${c.key}`}
                  checked={c.visivel}
                  onCheckedChange={() => toggle(c.key)}
                />
                <label
                  htmlFor={`col-${c.key}`}
                  className="flex-1 cursor-pointer truncate text-sm"
                >
                  {col?.label ?? c.key}
                </label>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === config.length - 1}
                  className="cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-default disabled:opacity-30"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

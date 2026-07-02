import { cn } from "@/lib/utils";
import type { TipMov } from "@/services/representantes/types";

/** Rótulo da métrica conforme o tipo de movimento selecionado. */
export function metricaLabel(tipmov: TipMov): string {
  return tipmov === "P" ? "Pedidos" : "Faturamento";
}

const OPCOES: { value: TipMov; label: string }[] = [
  { value: "V", label: "Faturamento" },
  { value: "P", label: "Pedidos" },
];

interface TipMovToggleProps {
  value: TipMov;
  onChange: (value: TipMov) => void;
  className?: string;
}

/** Segmented control: base de cálculo Faturamento (nota) x Pedidos. */
export function TipMovToggle({ value, onChange, className }: TipMovToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Base de cálculo"
      className={cn(
        "inline-flex h-9 items-center rounded-lg border bg-muted p-[3px]",
        className
      )}
    >
      {OPCOES.map((opt) => {
        const ativo = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => onChange(opt.value)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1 text-sm font-medium transition-colors",
              ativo
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

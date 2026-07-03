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
  /** Bloqueia a troca (ex.: telas que só usam faturamento). */
  disabled?: boolean;
  /** Chamado ao clicar quando bloqueado (ex.: exibir um toast). */
  onDisabledClick?: () => void;
}

/**
 * Segmented control: base de cálculo Faturamento (nota) x Pedidos.
 * As opções dividem a largura igualmente (50/50).
 */
export function TipMovToggle({
  value,
  onChange,
  className,
  disabled = false,
  onDisabledClick,
}: TipMovToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Base de cálculo"
      className={cn(
        "flex h-9 w-full items-center rounded-lg border bg-muted p-[3px]",
        disabled && "opacity-70",
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
            aria-disabled={disabled}
            onClick={() => {
              if (disabled) {
                onDisabledClick?.();
                return;
              }
              onChange(opt.value);
            }}
            className={cn(
              "flex-1 rounded-md px-3 py-1 text-center text-sm font-medium transition-colors",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
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

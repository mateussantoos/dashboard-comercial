import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPct, formatSignedPct } from "@/lib/format";

interface PctBadgeProps {
  value: number | null | undefined;
  /**
   * "delta" (default): variação (verde se +, vermelho se −, com seta).
   * "share": participação (sem sinal, badge neutro).
   */
  variant?: "delta" | "share";
  className?: string;
}

/** Percentual em badge colorido — padrão visual das tabelas. */
export function PctBadge({ value, variant = "delta", className }: PctBadgeProps) {
  if (value == null || !Number.isFinite(value)) {
    return <span className="text-muted-foreground">—</span>;
  }

  if (variant === "share") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground",
          className
        )}
      >
        {formatPct(value)}
      </span>
    );
  }

  const positivo = value > 0;
  const negativo = value < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
        positivo && "bg-success/10 text-success",
        negativo && "bg-destructive/10 text-destructive",
        !positivo && !negativo && "bg-muted text-muted-foreground",
        className
      )}
    >
      {positivo ? (
        <TrendingUp className="size-3" />
      ) : negativo ? (
        <TrendingDown className="size-3" />
      ) : null}
      {formatSignedPct(value)}
    </span>
  );
}

/** Helper para `format` de coluna: variação (verde/vermelho). */
export const pctDeltaCell = (v: unknown) => (
  <PctBadge value={v == null ? null : Number(v)} variant="delta" />
);

/** Helper para `format` de coluna: participação (badge neutro). */
export const pctShareCell = (v: unknown) => (
  <PctBadge value={v == null ? null : Number(v)} variant="share" />
);

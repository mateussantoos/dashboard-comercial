import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatSignedPct } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "./dashboard-card";

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  /** Texto auxiliar dentro do painel (ex.: "em 2026"). */
  hint?: string;
  /** Variação em pontos percentuais (YoY). Positivo = alta. */
  delta?: number | null;
  deltaLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

/**
 * Cartão de KPI seguindo o padrão do dashboard: título no topo à esquerda e
 * painel interno cinza com o número em destaque e a variação.
 */
export function KpiCard({
  title,
  value,
  hint,
  delta,
  deltaLabel,
  icon,
  loading = false,
}: KpiCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positivo = hasDelta && (delta as number) >= 0;

  return (
    <DashboardCard
      title={title}
      action={icon ? <span className="text-muted-foreground">{icon}</span> : null}
      innerClassName="flex flex-col justify-between gap-2"
    >
      {loading ? (
        <Skeleton className="h-8 w-32" />
      ) : (
        <div className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </div>
      )}

      <div className="flex items-center gap-2">
        {hasDelta && !loading ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
              positivo
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            )}
          >
            {positivo ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {formatSignedPct(delta as number)}
          </span>
        ) : null}
        {(deltaLabel || hint) && !loading ? (
          <span className="truncate text-xs text-muted-foreground">
            {deltaLabel ?? hint}
          </span>
        ) : null}
      </div>
    </DashboardCard>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

interface DashboardCardProps
  extends Omit<React.ComponentProps<"section">, "title"> {
  /** Título exibido no topo à esquerda. */
  title: React.ReactNode;
  /** Texto de apoio abaixo do título. */
  subtitle?: React.ReactNode;
  /**
   * Barra de ferramentas (exportar CSV/JPG, alternar tabela/gráfico, maximizar).
   * Renderizada na área externa branca, no canto superior direito do card.
   */
  toolbar?: React.ReactNode;
  /** Conteúdo/ações antes da toolbar, à direita (ex.: selects). */
  action?: React.ReactNode;
  /** Classe aplicada ao painel interno (cinza) que envolve o conteúdo. */
  innerClassName?: string;
  /**
   * Altura fixa (px) do painel interno para padronizar os cards. Quando
   * definida, o conteúdo excedente rola dentro do painel.
   */
  bodyHeight?: number;
  /** Ref do painel interno — usado para exportar o conteúdo como imagem. */
  innerRef?: React.Ref<HTMLDivElement>;
  /**
   * Quando true, o card inteiro cresce via flex-1 para preencher o container pai.
   * Usado na visão gerencial para que os cards preencham a viewport.
   */
  fill?: boolean;
}

/**
 * Padrão de design do dashboard: card externo arredondado com título no topo
 * à esquerda e um painel interno menor, arredondado e cinza, que envolve as
 * informações. Botões de ação ficam na área externa (branca), no canto direito.
 */
export function DashboardCard({
  title,
  subtitle,
  toolbar,
  action,
  className,
  innerClassName,
  bodyHeight,
  innerRef,
  fill = false,
  children,
  ...props
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-xl border bg-card p-4 shadow-sm sm:p-5",
        fill && "flex-1 min-h-0",
        className
      )}
      {...props}
    >
      <header className="mb-3 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action || toolbar ? (
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {toolbar ? (
              <div className="flex items-center gap-1">{toolbar}</div>
            ) : null}
          </div>
        ) : null}
      </header>

      <div
        ref={innerRef}
        style={bodyHeight ? { height: bodyHeight } : undefined}
        className={cn(
          "rounded-lg border border-border/60 bg-muted/70 p-3 sm:p-4",
          bodyHeight ? "overflow-auto" : "flex-1 min-h-0 overflow-auto",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

/** Classe base dos botões de ícone da barra de ferramentas do card. */
export const toolbarButtonClass = cn(
  "inline-flex size-7 cursor-pointer items-center justify-center rounded-md border bg-background text-muted-foreground shadow-xs transition-colors",
  "hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
  "[&_svg]:size-4"
);

/** Botão de ícone da barra de ferramentas do card (área externa). */
export function ToolbarButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={toolbarButtonClass}
    >
      {children}
    </button>
  );
}

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface CampoDetalhe {
  label: string;
  valor: React.ReactNode;
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  campos: CampoDetalhe[];
}

/**
 * Dialog de detalhamento: mostra o conjunto de dados (todos os campos) que
 * formam a linha/ponto clicado em uma tabela ou gráfico.
 */
export function DetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  campos,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : null}
        </DialogHeader>
        <div className="max-h-[60vh] divide-y overflow-auto rounded-lg border">
          {campos.map((c) => (
            <div
              key={c.label}
              className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{c.label}</span>
              <span className="text-right font-medium tabular-nums">
                {c.valor}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

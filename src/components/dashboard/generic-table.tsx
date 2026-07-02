import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Definição de coluna orientada a dados (renderização + CSV). */
export interface Coluna<T> {
  key: keyof T & string;
  label: string;
  align?: "left" | "right";
  /** Formatação de exibição da célula (o CSV usa o valor bruto de `key`). */
  format?: (value: T[keyof T], row: T) => React.ReactNode;
  /** Conteúdo da linha de rodapé (totais). Se ausente, célula vazia. */
  footer?: React.ReactNode;
}

interface GenericTableProps<T> {
  data: T[];
  colunas: Coluna<T>[];
  rowKey: (row: T, index: number) => React.Key;
  showFooter?: boolean;
  emptyMessage?: string;
  /** Ao clicar em uma linha, abre o detalhamento dos dados. */
  onRowClick?: (row: T) => void;
}

/** Tabela genérica dirigida por definição de colunas. */
export function GenericTable<T>({
  data,
  colunas,
  rowKey,
  showFooter = false,
  emptyMessage = "Sem dados para exibir.",
  onRowClick,
}: GenericTableProps<T>) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {colunas.map((c) => (
            <TableHead
              key={c.key}
              className={cn(c.align === "right" && "text-right")}
            >
              {c.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow
            key={rowKey(row, i)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={onRowClick ? "cursor-pointer" : undefined}
          >
            {colunas.map((c) => (
              <TableCell
                key={c.key}
                className={cn(
                  "tabular-nums",
                  c.align === "right" && "text-right"
                )}
              >
                {c.format ? c.format(row[c.key], row) : String(row[c.key] ?? "")}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
      {showFooter ? (
        <TableFooter>
          <TableRow>
            {colunas.map((c) => (
              <TableCell
                key={c.key}
                className={cn("tabular-nums", c.align === "right" && "text-right")}
              >
                {c.footer ?? null}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  );
}

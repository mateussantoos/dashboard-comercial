import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";

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

export type SortDir = "asc" | "desc";

interface GenericTableProps<T> {
  data: T[];
  colunas: Coluna<T>[];
  rowKey: (row: T, index: number) => React.Key;
  showFooter?: boolean;
  emptyMessage?: string;
  /** Ao clicar em uma linha, abre o detalhamento dos dados. */
  onRowClick?: (row: T) => void;
  /** Coluna atualmente ordenada. */
  sortKey?: string | null;
  /** Direção da ordenação. */
  sortDir?: SortDir;
  /** Callback quando o usuário clica no header para ordenar. */
  onSort?: (key: string, dir: SortDir) => void;
}

/** Tabela genérica dirigida por definição de colunas, com ordenação por coluna. */
export function GenericTable<T>({
  data,
  colunas,
  rowKey,
  showFooter = false,
  emptyMessage = "Sem dados para exibir.",
  onRowClick,
  sortKey,
  sortDir,
  onSort,
}: GenericTableProps<T>) {
  function handleHeaderClick(key: string) {
    if (!onSort) return;
    if (sortKey === key) {
      // Toggle direction
      onSort(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "asc");
    }
  }

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
        <TableRow className="hover:bg-transparent">
          {colunas.map((c) => {
            const isActive = sortKey === c.key;
            return (
              <TableHead
                key={c.key}
                className={cn(
                  c.align === "right" && "text-right",
                  onSort && "cursor-pointer select-none hover:text-foreground"
                )}
                onClick={onSort ? () => handleHeaderClick(c.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {c.label}
                  {onSort ? (
                    isActive ? (
                      sortDir === "asc" ? (
                        <ChevronUp className="size-3.5 text-foreground" />
                      ) : (
                        <ChevronDown className="size-3.5 text-foreground" />
                      )
                    ) : (
                      <ChevronsUpDown className="size-3.5 text-muted-foreground/50" />
                    )
                  ) : null}
                </span>
              </TableHead>
            );
          })}
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

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MESES = [
  { n: 1, label: "Janeiro" },
  { n: 2, label: "Fevereiro" },
  { n: 3, label: "Março" },
  { n: 4, label: "Abril" },
  { n: 5, label: "Maio" },
  { n: 6, label: "Junho" },
  { n: 7, label: "Julho" },
  { n: 8, label: "Agosto" },
  { n: 9, label: "Setembro" },
  { n: 10, label: "Outubro" },
  { n: 11, label: "Novembro" },
  { n: 12, label: "Dezembro" },
];

const TODOS = MESES.map((m) => m.n);

interface MesesFilterProps {
  value: number[];
  onChange: (meses: number[]) => void;
  className?: string;
}

/** Filtro de meses (checkboxes com "todos" e busca). Default: todos marcados. */
export function MesesFilter({ value, onChange, className }: MesesFilterProps) {
  const [busca, setBusca] = useState("");

  const todosMarcados = value.length >= 12;
  const nenhumMarcado = value.length === 0;
  const filtrados = MESES.filter((m) =>
    m.label.toLowerCase().includes(busca.trim().toLowerCase())
  );

  function marcado(n: number) {
    return value.includes(n);
  }

  function toggle(n: number) {
    const proximo = value.includes(n)
      ? value.filter((m) => m !== n)
      : [...value, n];
    onChange(proximo.sort((a, b) => a - b));
  }

  function toggleTodos() {
    // Marcado (todos) → desmarca todos; caso contrário → marca todos.
    onChange(todosMarcados ? [] : [...TODOS]);
  }

  const label = todosMarcados
    ? "Todos os meses"
    : nenhumMarcado
      ? "Nenhum mês"
      : `${value.length} ${value.length === 1 ? "mês" : "meses"}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`w-full justify-between font-normal ${className ?? ""}`}
        >
          {label}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <Input
          placeholder="Buscar mês…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-8"
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
          <Checkbox checked={todosMarcados} onCheckedChange={toggleTodos} />
          Todos os meses
        </label>
        <div className="mt-1 max-h-56 overflow-auto border-t pt-1">
          {filtrados.map((m) => (
            <label
              key={m.n}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={marcado(m.n)}
                onCheckedChange={() => toggle(m.n)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

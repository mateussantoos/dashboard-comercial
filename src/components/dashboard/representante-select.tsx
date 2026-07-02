import * as React from "react";
import { Check, ChevronsUpDown, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Representante } from "@/services/representantes/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ComboboxProps {
  representantes: Representante[];
  value: number | null;
  onChange: (codvend: number) => void;
  loading?: boolean;
  className?: string;
}

/** Seletor individual de representante com busca. */
export function RepresentanteCombobox({
  representantes,
  value,
  onChange,
  loading = false,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selecionado = representantes.find((r) => r.codvend === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={loading}
          className={cn(
            "w-full justify-between font-normal sm:w-72",
            !selecionado && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {loading
              ? "Carregando representantes…"
              : selecionado
                ? selecionado.nome
                : "Selecione um representante"}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar representante…" />
          <CommandList>
            <CommandEmpty>Nenhum representante encontrado.</CommandEmpty>
            <CommandGroup>
              {representantes.map((r) => (
                <CommandItem
                  key={r.codvend}
                  value={`${r.nome} ${r.codvend}`}
                  onSelect={() => {
                    onChange(r.codvend);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      value === r.codvend ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{r.nome}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    #{r.codvend}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface MultiSelectProps {
  representantes: Representante[];
  values: number[];
  onChange: (codvends: number[]) => void;
  loading?: boolean;
  max?: number;
  className?: string;
}

/** Seleção múltipla de representantes (aba comparar). */
export function RepresentanteMultiSelect({
  representantes,
  values,
  onChange,
  loading = false,
  max = 5,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  function toggle(codvend: number) {
    if (values.includes(codvend)) {
      onChange(values.filter((v) => v !== codvend));
    } else if (values.length < max) {
      onChange([...values, codvend]);
    }
  }

  const label =
    values.length === 0
      ? "Selecione representantes"
      : `${values.length} selecionado${values.length > 1 ? "s" : ""}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={loading}
          className={cn(
            "w-full justify-between font-normal sm:w-72",
            values.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Users className="size-4 opacity-60" />
            {label}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar representante…" />
          <CommandList>
            <CommandEmpty>Nenhum representante encontrado.</CommandEmpty>
            <CommandGroup>
              {representantes.map((r) => {
                const marcado = values.includes(r.codvend);
                const bloqueado = !marcado && values.length >= max;
                return (
                  <CommandItem
                    key={r.codvend}
                    value={`${r.nome} ${r.codvend}`}
                    disabled={bloqueado}
                    onSelect={() => toggle(r.codvend)}
                  >
                    <Check
                      className={cn(marcado ? "opacity-100" : "opacity-0")}
                    />
                    <span className="truncate">{r.nome}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      #{r.codvend}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

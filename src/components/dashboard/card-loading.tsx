import { Loader2 } from "lucide-react";

interface CardLoadingProps {
  mensagem?: string;
  detalhe?: string;
}

/**
 * Estado de carregamento dentro de um card: spinner + mensagem centralizados
 * (substitui o skeleton cinza, deixando o carregamento mais evidente).
 */
export function CardLoading({
  mensagem = "Carregando dados…",
  detalhe = "Consultando o Sankhya",
}: CardLoadingProps) {
  return (
    <div className="flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-3 text-center">
      <Loader2 className="size-8 animate-spin text-primary" />
      <div className="leading-tight">
        <p className="text-sm font-medium text-foreground">{mensagem}</p>
        <p className="text-xs text-muted-foreground">{detalhe}</p>
      </div>
    </div>
  );
}

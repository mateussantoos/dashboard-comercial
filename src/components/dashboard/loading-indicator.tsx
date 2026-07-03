import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  show: boolean;
  label?: string;
  description?: string;
}

/**
 * Cartão flutuante (canto inferior direito) indicando que os dados estão sendo
 * carregados. Aparece enquanto `show` e some sozinho ao terminar.
 */
export function LoadingIndicator({
  show,
  label = "Carregando dados",
  description = "Consultando o Sankhya…",
}: LoadingIndicatorProps) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-2"
    >
      <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
      <div className="leading-tight">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

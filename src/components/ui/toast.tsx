import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "info" | "success" | "warning";

interface ToastItem {
  id: number;
  message: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastOptions {
  description?: string;
  variant?: ToastVariant;
  /** Duração em ms (0 = fixo até o usuário fechar). Default 3800. */
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, opts?: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

/** Dispara toasts a partir de qualquer componente da árvore. */
export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast precisa estar dentro de <ToastProvider>.");
  }
  return ctx;
}

const ICON: Record<ToastVariant, React.ReactNode> = {
  info: <Info className="size-4 text-primary" />,
  success: <CheckCircle2 className="size-4 text-success" />,
  warning: <AlertTriangle className="size-4 text-destructive" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const remove = React.useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (message: string, opts: ToastOptions = {}) => {
      setItems((prev) => {
        // Evita empilhar toasts idênticos (ex.: cliques repetidos).
        if (prev.some((t) => t.message === message)) return prev;
        const id = ++idRef.current;
        const duration = opts.duration ?? 3800;
        if (duration > 0) {
          window.setTimeout(() => remove(id), duration);
        }
        return [
          ...prev,
          {
            id,
            message,
            description: opts.description,
            variant: opts.variant ?? "info",
          },
        ];
      });
    },
    [remove]
  );

  const value = React.useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2.5 rounded-lg border bg-card p-3 shadow-lg animate-in fade-in slide-in-from-top-2"
          >
            <span className="mt-0.5 shrink-0">{ICON[t.variant]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{t.message}</p>
              {t.description ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => remove(t.id)}
              aria-label="Fechar"
              className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

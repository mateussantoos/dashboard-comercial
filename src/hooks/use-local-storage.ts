import { useEffect, useState } from "react";

/** Estado persistido no localStorage (JSON), com fallback silencioso. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignora quota/privado */
    }
  }, [key, value]);

  return [value, setValue] as const;
}

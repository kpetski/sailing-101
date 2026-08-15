import { useEffect, useState } from "react";

/** Persists a piece of state to localStorage under `key`, keeping it in sync across renders. */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage unavailable (private browsing, quota, etc.) — fail silently, in-memory state still works.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

import { useEffect, useState } from "react";

/**
 * Returns a copy of `value` that only updates after `delay` ms have passed
 * without it changing. Used to debounce live search inputs so we don't push a
 * navigation on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

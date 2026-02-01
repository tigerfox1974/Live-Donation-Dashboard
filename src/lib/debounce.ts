import { useRef, useCallback, useEffect } from 'react';

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed
 * since the last time it was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
      timeoutId = null;
    }, wait);
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
    }
  };

  debouncedFn.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
      lastArgs = null;
    }
  };

  return debouncedFn;
}

/**
 * Hook for debounced localStorage writes
 */
export function useDebouncedLocalStorage<T>(
  key: string,
  value: T,
  delay: number = 500,
  enabled: boolean = true
) {
  const debouncedSaveRef = useRef<ReturnType<typeof debounce> | null>(null);

  useEffect(() => {
    if (!enabled || !key) return;

    if (!debouncedSaveRef.current) {
      debouncedSaveRef.current = debounce((k: string, v: T) => {
        try {
          localStorage.setItem(k, JSON.stringify(v));
        } catch {
          // localStorage full or disabled
        }
      }, delay);
    }

    debouncedSaveRef.current(key, value);

    return () => {
      // Flush on unmount to ensure data is saved
      debouncedSaveRef.current?.flush();
    };
  }, [key, value, delay, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSaveRef.current?.flush();
    };
  }, []);
}

/**
 * Hook for creating a stable debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Create debounced function once
  useEffect(() => {
    debouncedRef.current = debounce((...args: Parameters<T>) => {
      callbackRef.current(...args);
    }, delay);

    return () => {
      debouncedRef.current?.cancel();
    };
  }, [delay]);

  return useCallback((...args: Parameters<T>) => {
    debouncedRef.current?.(...args);
  }, []);
}

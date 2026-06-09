import { useCallback, useRef, useState } from "react";

/**
 * Verhindert Doppelklicks bei async Aktionen.
 * @returns {{ isLocked, runLocked, unlock, lockRef }}
 */
export function useAsyncLock() {
  const lockRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const unlock = useCallback(() => {
    lockRef.current = false;
    setIsLocked(false);
  }, []);

  const runLocked = useCallback(
    async (fn, { keepLocked = false } = {}) => {
      if (lockRef.current) return false;
      lockRef.current = true;
      setIsLocked(true);
      try {
        await fn();
        return true;
      } finally {
        if (!keepLocked) {
          lockRef.current = false;
          setIsLocked(false);
        }
      }
    },
    []
  );

  return { isLocked, runLocked, unlock, lockRef };
}

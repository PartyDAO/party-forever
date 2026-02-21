import { createContext, type ReactNode, useCallback, useMemo, useRef, useState } from "react";

export interface EnsContextValue {
  ensNames: Map<string, string | null>;
  registerAddress: (address: string) => void;
}

export const EnsContext = createContext<EnsContextValue | null>(null);

type EnsResolver = (addresses: string[]) => Promise<Map<string, string | null>>;

const DEBOUNCE_MS = 150;

export const EnsProvider = ({
  resolver,
  children
}: {
  resolver: EnsResolver;
  children: ReactNode;
}) => {
  const [ensNames, setEnsNames] = useState<Map<string, string | null>>(new Map());
  const ensNamesRef = useRef(ensNames);
  ensNamesRef.current = ensNames;

  const resolverRef = useRef(resolver);
  resolverRef.current = resolver;

  const queueRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const registerAddress = useCallback((address: string) => {
    const normalized = address.toLowerCase();
    if (ensNamesRef.current.has(normalized)) return;

    queueRef.current.push(normalized);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      const batch = queueRef.current;
      queueRef.current = [];

      resolverRef
        .current(batch)
        .then((results) => {
          setEnsNames((prev) => {
            const next = new Map(prev);
            for (const [addr, name] of results) {
              next.set(addr, name);
            }
            return next;
          });
        })
        .catch((error) => {
          console.log("ENS batch lookup failed", error);
        });
    }, DEBOUNCE_MS);
  }, []);

  const value = useMemo(() => ({ ensNames, registerAddress }), [ensNames, registerAddress]);

  return <EnsContext.Provider value={value}>{children}</EnsContext.Provider>;
};

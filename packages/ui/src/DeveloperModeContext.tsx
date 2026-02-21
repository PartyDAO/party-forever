import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "party-forever-developer-mode";

const readFromStorage = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const writeToStorage = (enabled: boolean) => {
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY, "true");
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

type DeveloperModeContextValue = {
  developerMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
};

const DeveloperModeContext = createContext<DeveloperModeContextValue | null>(null);

export const DeveloperModeProvider = ({ children }: { children: ReactNode }) => {
  const [developerMode, setState] = useState(readFromStorage);

  const setDeveloperMode = useCallback((enabled: boolean) => {
    writeToStorage(enabled);
    setState(enabled);
  }, []);

  const value = useMemo(
    () => ({ developerMode, setDeveloperMode }),
    [developerMode, setDeveloperMode]
  );

  return <DeveloperModeContext.Provider value={value}>{children}</DeveloperModeContext.Provider>;
};

export const useDeveloperMode = (): DeveloperModeContextValue => {
  const ctx = useContext(DeveloperModeContext);
  if (!ctx) {
    throw new Error("useDeveloperMode must be used within DeveloperModeProvider");
  }
  return ctx;
};

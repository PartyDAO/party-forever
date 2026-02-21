import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { useAccount as useWagmiAccount } from "wagmi";

type SimulatedWalletContextValue = {
  simulatedAddress: `0x${string}` | null;
  setSimulatedAddress: (address: `0x${string}` | null) => void;
};

const SimulatedWalletContext = createContext<SimulatedWalletContextValue | null>(null);

export const SimulatedWalletProvider = ({ children }: { children: ReactNode }) => {
  const [simulatedAddress, setState] = useState<`0x${string}` | null>(null);

  const setSimulatedAddress = useCallback((address: `0x${string}` | null) => {
    setState(address);
  }, []);

  const value = useMemo(
    () => ({ simulatedAddress, setSimulatedAddress }),
    [simulatedAddress, setSimulatedAddress]
  );

  return (
    <SimulatedWalletContext.Provider value={value}>{children}</SimulatedWalletContext.Provider>
  );
};

export const useSimulatedWallet = (): SimulatedWalletContextValue => {
  const ctx = useContext(SimulatedWalletContext);
  if (!ctx) {
    throw new Error("useSimulatedWallet must be used within SimulatedWalletProvider");
  }
  return ctx;
};

/**
 * Returns the effective "connected" address and connection state.
 * When a simulated wallet is set, it overrides the real wallet address for display and read-only logic.
 * When simulating, isConnected is true so the UI shows as that user; sending txs still requires a real wallet connection.
 */
export const useAccount = (): {
  account: `0x${string}` | undefined;
  isConnected: boolean;
} => {
  const { address: realAddress, isConnected: realIsConnected } = useWagmiAccount();
  const { simulatedAddress } = useSimulatedWallet();

  return useMemo(() => {
    const account = (simulatedAddress ?? realAddress) as `0x${string}` | undefined;
    const isConnected = simulatedAddress !== null || realIsConnected;
    return { account, isConnected };
  }, [simulatedAddress, realAddress, realIsConnected]);
};

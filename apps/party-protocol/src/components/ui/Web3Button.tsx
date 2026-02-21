import type { NetworkName } from "@party-forever/contracts";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useChainId, useSendTransaction, useSwitchChain } from "wagmi";

import { buildTenderlySimulatorUrl, Button, useAccount, useDeveloperMode } from "@party-forever/ui";
import { getChainIdForNetwork, getClient } from "@/lib/client.ts";

const EXPLORER_BASE_URLS: Record<NetworkName, string> = {
  mainnet: "https://etherscan.io",
  base: "https://basescan.org",
  zora: "https://explorer.zora.energy"
};

export interface TxData {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

export type Web3ButtonStatus = "idle" | "loading" | "success" | "error";

interface Web3ButtonProps {
  networkName: NetworkName;
  txnFn: () => Promise<TxData>;
  actionName: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onStatusChange?: (status: Web3ButtonStatus) => void;
  variant?: "default" | "destructive";
  className?: string;
}

export const Web3Button = ({
  networkName,
  txnFn,
  actionName,
  disabled,
  onSuccess,
  onStatusChange,
  variant = "default",
  className
}: Web3ButtonProps) => {
  const { isConnected, account } = useAccount();
  const { developerMode } = useDeveloperMode();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { sendTransactionAsync } = useSendTransaction();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const requiredChainId = getChainIdForNetwork(networkName);

  if (!isConnected) {
    return (
      <div>
        <Button onClick={() => openConnectModal?.()}>Connect wallet</Button>
      </div>
    );
  }

  if (currentChainId !== requiredChainId) {
    return (
      <div>
        <Button onClick={() => switchChain({ chainId: requiredChainId })}>Change network</Button>
      </div>
    );
  }

  const handleSend = async () => {
    setStatus("loading");
    onStatusChange?.("loading");
    setErrorMessage(null);
    setTxHash(null);
    try {
      const txData = await txnFn();
      const hash = await sendTransactionAsync({
        to: txData.to,
        data: txData.data,
        value: txData.value
      });
      setTxHash(hash);
      await getClient(networkName).waitForTransactionReceipt({ hash });
      setStatus("success");
      onStatusChange?.("success");
      onSuccess?.();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setStatus("error");
      onStatusChange?.("error");
    }
  };

  const isDisabled = disabled || status === "loading" || status === "success";

  const handleSimulate = async () => {
    if (!account) return;
    try {
      const txData = await txnFn();
      const url = buildTenderlySimulatorUrl({
        from: account,
        to: txData.to,
        data: txData.data,
        value: txData.value ?? 0n,
        networkId: requiredChainId
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error("Failed to build simulate URL:", e);
    }
  };

  const buttonText = (() => {
    switch (status) {
      case "loading":
        return "Loading...";
      case "success":
        return "Success!";
      default:
        return actionName;
    }
  })();

  return (
    <div
      className={
        className != null
          ? `flex flex-col gap-1 items-stretch ${className}`
          : "flex w-full flex-col gap-1 items-stretch"
      }
    >
      <Button
        onClick={handleSend}
        disabled={isDisabled}
        variant={variant}
        className="w-full rounded-md"
      >
        {buttonText}
      </Button>
      <div className="flex items-center justify-center gap-2">
        {developerMode && (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
            onClick={handleSimulate}
          >
            Simulate
          </Button>
        )}
        {txHash && (
          <a
            href={`${EXPLORER_BASE_URLS[networkName]}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View Tx
          </a>
        )}
      </div>
      {errorMessage && <p className="text-sm text-destructive mt-1">{errorMessage}</p>}
    </div>
  );
};

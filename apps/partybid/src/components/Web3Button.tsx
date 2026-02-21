import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useChainId, useSendTransaction, useSwitchChain } from "wagmi";
import { mainnet } from "wagmi/chains";

import { buildTenderlySimulatorUrl, Button, useAccount, useDeveloperMode } from "@party-forever/ui";
import { getClient } from "@/lib/client.ts";

export interface TxData {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

interface Web3ButtonProps {
  txnFn: () => Promise<TxData>;
  actionName: string;
  disabled?: boolean;
  onSuccess?: () => void;
}

export const Web3Button = ({ txnFn, actionName, disabled, onSuccess }: Web3ButtonProps) => {
  const { isConnected, account } = useAccount();
  const { developerMode } = useDeveloperMode();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { sendTransactionAsync } = useSendTransaction();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!isConnected) {
    return <Button onClick={() => openConnectModal?.()}>Connect wallet</Button>;
  }

  if (currentChainId !== mainnet.id) {
    return <Button onClick={() => switchChain({ chainId: mainnet.id })}>Switch to Mainnet</Button>;
  }

  const handleSend = async () => {
    setStatus("loading");
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
      await getClient().waitForTransactionReceipt({ hash });
      setStatus("success");
      onSuccess?.();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setStatus("error");
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
        networkId: mainnet.id
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
        return `${actionName} Successful`;
      default:
        return actionName;
    }
  })();

  return (
    <div className="flex flex-col gap-1 items-start">
      <Button onClick={handleSend} disabled={isDisabled}>
        {buttonText}
      </Button>
      <div className="flex items-center gap-2">
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
            href={`https://etherscan.io/tx/${txHash}`}
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

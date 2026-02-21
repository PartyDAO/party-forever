import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useChainId, useSendTransaction, useSwitchChain, useAccount } from "wagmi";

import { Button } from "@party-forever/ui";
import { getChainId, getClient } from "@/lib/client.ts";
import type { TokenPageNetwork } from "@/lib/constants.ts";

export interface TxData {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
}

interface Web3ButtonProps {
  network: TokenPageNetwork;
  txnFn: () => Promise<TxData>;
  actionName: string;
  disabled?: boolean;
  onSuccess?: () => void;
  variant?: "default" | "destructive";
}

export const Web3Button = ({
  network,
  txnFn,
  actionName,
  disabled,
  onSuccess,
  variant = "default"
}: Web3ButtonProps) => {
  const { isConnected } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { sendTransactionAsync } = useSendTransaction();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requiredChainId = getChainId(network);

  if (!isConnected) {
    return (
      <Button type="button" onClick={() => openConnectModal?.()}>
        Connect wallet
      </Button>
    );
  }

  if (currentChainId !== requiredChainId) {
    return (
      <Button type="button" onClick={() => switchChain({ chainId: requiredChainId })}>
        Switch to Base
      </Button>
    );
  }

  const handleSend = async () => {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const txData = await txnFn();
      const hash = await sendTransactionAsync({
        to: txData.to,
        data: txData.data,
        value: txData.value
      });
      await getClient(network).waitForTransactionReceipt({ hash });
      setStatus("success");
      onSuccess?.();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  const isDisabled = disabled || status === "loading" || status === "success";

  const buttonText = (() => {
    switch (status) {
      case "loading":
        return "Confirm in wallet...";
      case "success":
        return "Done!";
      default:
        return actionName;
    }
  })();

  return (
    <div className="flex flex-col gap-1 items-start">
      <Button type="button" onClick={handleSend} disabled={isDisabled} variant={variant}>
        {buttonText}
      </Button>
      {errorMessage && <p className="text-sm text-destructive mt-1">{errorMessage}</p>}
    </div>
  );
};

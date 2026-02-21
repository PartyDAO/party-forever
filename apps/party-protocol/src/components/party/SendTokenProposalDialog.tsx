import { ERC20, type NetworkName, Party } from "@party-forever/contracts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseUnits } from "viem";

import { AdvancedProposalOptions } from "@/components/ui/AdvancedProposalOptions.tsx";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Label,
  useAccount
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client";

interface SendTokenProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember: boolean;
  initialTokenAddress?: string;
  initialDecimals?: number;
}

interface FormData {
  tokenContractAddress: string;
  amount: string;
  recipientAddress: string;
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

export const SendTokenProposalDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  isMember,
  initialTokenAddress = "",
  initialDecimals
}: SendTokenProposalDialogProps) => {
  const [proposalCreated, setProposalCreated] = useState(false);
  const [loadingMax, setLoadingMax] = useState(false);
  const { account: walletAddress } = useAccount();

  const { register, getValues, reset, setValue } = useForm<FormData>({
    defaultValues: {
      tokenContractAddress: "",
      amount: "",
      recipientAddress: "",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    }
  });

  useEffect(() => {
    if (!open) {
      setProposalCreated(false);
      return;
    }
    reset({
      tokenContractAddress: initialTokenAddress ?? "",
      amount: "",
      recipientAddress: "",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    });
  }, [open, initialTokenAddress, reset]);

  const handleMaxClick = async () => {
    setLoadingMax(true);
    try {
      const formValues = getValues();
      const tokenContract = formValues.tokenContractAddress.trim();
      if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
        return;
      }
      const client = getClient(network);
      const erc20 = new ERC20(network, tokenContract as `0x${string}`, client);
      const decimals = initialDecimals ?? (await erc20.fetchDecimals());
      const balance = await erc20.fetchBalance(partyAddress);
      setValue("amount", formatUnits(balance, decimals));
    } catch {
      // If fetch fails, do nothing
    } finally {
      setLoadingMax(false);
    }
  };

  const buildTx = async () => {
    const formValues = getValues();

    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    const tokenContract = formValues.tokenContractAddress.trim();
    if (!tokenContract.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid token contract address");
    }

    const amountStr = formValues.amount.trim();
    if (!amountStr) {
      throw new Error("Amount is required");
    }
    const amountNum = Number(amountStr);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const recipient = formValues.recipientAddress.trim();
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid recipient address");
    }

    const client = getClient(network);
    const erc20 = new ERC20(network, tokenContract as `0x${string}`, client);
    const decimals = initialDecimals ?? (await erc20.fetchDecimals());
    const amountWei = parseUnits(amountStr, decimals);

    const data = erc20.encodeTransfer(recipient as `0x${string}`, amountWei);

    const party = await Party.create(network, partyAddress, client);

    const maxExecutableTimeDays = Number(formValues.maxExecutableTimeDays);
    if (Number.isNaN(maxExecutableTimeDays) || maxExecutableTimeDays <= 0) {
      throw new Error("Max executable time must be a positive number of days");
    }
    const cancelDelayNum = Number(formValues.cancelDelay);
    if (Number.isNaN(cancelDelayNum) || cancelDelayNum <= 0) {
      throw new Error("Cancel delay must be a positive number of seconds");
    }

    const now = Math.floor(Date.now() / 1000);
    const maxExecutableTime = String(now + maxExecutableTimeDays * 24 * 60 * 60);

    const latestSnapIndex = await party.findVotingPowerSnapshotIndex(walletAddress, now);

    return party.generateArbitraryBytecodeProposalTx({
      maxExecutableTime,
      cancelDelay: String(cancelDelayNum),
      latestSnapIndex: latestSnapIndex.toString(),
      target: tokenContract as `0x${string}`,
      data,
      value: 0n
    });
  };

  const handleSuccess = () => {
    setProposalCreated(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Propose sending token</DialogTitle>
        <DialogDescription>
          Create a proposal to send ERC20 tokens from the party to an address. The proposal must
          pass and be executed for the transfer to occur.
        </DialogDescription>
        <p className="text-muted-foreground text-sm">
          You can view the party&apos;s token balances on{" "}
          <EtherscanLink
            network={network}
            address={partyAddress}
            addressType="address"
            text="etherscan"
          />{" "}
          or on the Inventory tab.
        </p>
        {proposalCreated ? (
          <p className="mt-4 text-sm font-medium text-green-600">Proposal created!</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="send-token-contract">Token contract address</Label>
              <Input
                id="send-token-contract"
                placeholder="0x..."
                {...register("tokenContractAddress")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="send-token-amount">Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="send-token-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  className="flex-1"
                  {...register("amount")}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMaxClick}
                  disabled={loadingMax}
                >
                  {loadingMax ? "Loading..." : "Max"}
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="send-token-recipient">Recipient address</Label>
              <Input
                id="send-token-recipient"
                placeholder="0x..."
                {...register("recipientAddress")}
              />
            </div>
            <AdvancedProposalOptions register={register} idPrefix="send-token-" />
            {!isMember && (
              <p className="text-destructive text-sm">
                You must be a member of the party to submit a proposal.
              </p>
            )}
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName="Submit proposal"
              disabled={!isMember}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

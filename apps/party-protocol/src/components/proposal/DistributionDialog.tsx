/**
 * Distribution dialog for both ETH and NFT parties.
 *
 * - "proposal": Creates a distribution proposal that requires a governance vote (ETH parties).
 *   The user specifies an amount and proposal parameters.
 * - "direct": Distributes the party's full token balance directly, no vote required (NFT parties).
 */
import {
  type DistributionProposalParams,
  ERC20,
  type NetworkName,
  Party,
  TokenType
} from "@party-forever/contracts";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { formatUnits, parseEther, parseUnits } from "viem";

import { AdvancedProposalOptions } from "@/components/ui/AdvancedProposalOptions.tsx";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Label,
  Select,
  useAccount
} from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

interface DistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember: boolean;
  distributionType: "proposal" | "direct";
  initialTokenAddress?: string;
  initialAmount?: string;
}

interface FormData {
  tokenType: string;
  tokenAddress: string;
  amount: string;
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

const TOKEN_TYPE_OPTIONS = [
  { value: TokenType.ETH, label: "ETH" },
  { value: TokenType.ERC20, label: "ERC20" }
];

export const DistributionDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  isMember,
  distributionType,
  initialTokenAddress,
  initialAmount
}: DistributionDialogProps) => {
  const isDirect = distributionType === "direct";
  const [proposalCreated, setProposalCreated] = useState(false);
  const [loadingMax, setLoadingMax] = useState(false);
  const { account: walletAddress } = useAccount();

  const { register, getValues, control, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      tokenType: TokenType.ETH,
      tokenAddress: "",
      amount: "",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    }
  });

  const watchedTokenType = watch("tokenType");

  useEffect(() => {
    if (!open) {
      setProposalCreated(false);
      return;
    }
    reset({
      tokenType: initialTokenAddress ? TokenType.ERC20 : TokenType.ETH,
      tokenAddress: initialTokenAddress ?? "",
      amount: initialAmount ?? "",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    });
  }, [open, initialTokenAddress, initialAmount, reset]);

  const fetchPartyBalance = async (): Promise<{ balance: bigint; decimals: number }> => {
    const formValues = getValues();
    const client = getClient(network);

    if (formValues.tokenType === TokenType.ETH) {
      const balance = await client.getBalance({ address: partyAddress });
      return { balance, decimals: 18 };
    }

    const tokenAddr = formValues.tokenAddress.trim();
    if (!tokenAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid token address");
    }

    const erc20 = new ERC20(network, tokenAddr as `0x${string}`, client);
    const [balance, decimals] = await Promise.all([
      erc20.fetchBalance(partyAddress),
      erc20.fetchDecimals()
    ]);
    return { balance, decimals };
  };

  const handleMaxClick = async () => {
    setLoadingMax(true);
    try {
      const { balance, decimals } = await fetchPartyBalance();
      setValue("amount", formatUnits(balance, decimals));
    } catch {
      // If fetch fails, do nothing
    } finally {
      setLoadingMax(false);
    }
  };

  const generateDistributionParams = async (
    formValues: FormData
  ): Promise<DistributionProposalParams> => {
    const amountStr = formValues.amount.trim();
    const client = getClient(network);

    if (formValues.tokenType === TokenType.ETH) {
      let amountWei: bigint;
      try {
        amountWei = parseEther(amountStr);
      } catch {
        throw new Error("Invalid ETH amount");
      }

      const { balance } = await fetchPartyBalance();
      if (amountWei > balance) {
        throw new Error("Amount exceeds party's ETH balance");
      }

      return { tokenType: TokenType.ETH, amountWei };
    }

    const tokenAddr = formValues.tokenAddress.trim();
    if (!tokenAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid token address");
    }

    const erc20 = new ERC20(network, tokenAddr as `0x${string}`, client);
    const decimals = await erc20.fetchDecimals();
    const amountWei = parseUnits(amountStr, decimals);

    const balance = await erc20.fetchBalance(partyAddress);
    if (amountWei > balance) {
      throw new Error("Amount exceeds party's token balance");
    }

    return {
      tokenType: TokenType.ERC20,
      tokenAddress: tokenAddr as `0x${string}`,
      amountWei
    };
  };

  const buildDirectTx = async (party: Party, formValues: FormData) => {
    if (formValues.tokenType === TokenType.ERC20) {
      const tokenAddr = formValues.tokenAddress.trim();
      if (!tokenAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid token address");
      }
      return party.generateDistributeTx({
        tokenType: TokenType.ERC20 as const,
        tokenAddress: tokenAddr as `0x${string}`
      });
    }
    return party.generateDistributeTx({ tokenType: TokenType.ETH as const });
  };

  const buildProposalTx = async (party: Party, formValues: FormData, walletAddr: `0x${string}`) => {
    const amountStr = formValues.amount.trim();
    if (!amountStr) {
      throw new Error("Amount is required");
    }
    const amountNum = Number.parseFloat(amountStr);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      throw new Error("Amount must be a positive number");
    }

    const maxExecutableTimeDays = Number(formValues.maxExecutableTimeDays);
    if (Number.isNaN(maxExecutableTimeDays) || maxExecutableTimeDays <= 0) {
      throw new Error("Max executable time must be a positive number of days");
    }

    const cancelDelay = Number(formValues.cancelDelay);
    if (Number.isNaN(cancelDelay) || cancelDelay <= 0) {
      throw new Error("Cancel delay must be a positive number");
    }

    const distributionParams = await generateDistributionParams(formValues);
    const now = Math.floor(Date.now() / 1000);
    const maxExecutableTime = String(now + maxExecutableTimeDays * 24 * 60 * 60);
    const latestSnapIndex = await party.findVotingPowerSnapshotIndex(walletAddr, now);

    return party.generateDistributionProposalTx(
      distributionParams,
      maxExecutableTime,
      String(cancelDelay),
      latestSnapIndex.toString()
    );
  };

  const buildTx = async () => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    const formValues = getValues();
    const client = getClient(network);
    const party = await Party.create(network, partyAddress, client);

    return isDirect
      ? buildDirectTx(party, formValues)
      : buildProposalTx(party, formValues, walletAddress);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{isDirect ? "Distribute" : "New Distribution Proposal"}</DialogTitle>
        <DialogDescription>
          {isDirect
            ? "Distribute tokens from this Party to its members (no vote required)."
            : "Create a proposal to distribute tokens from this Party to its members."}
        </DialogDescription>
        {proposalCreated ? (
          <p className="text-sm font-medium text-green-600 mt-4">
            {isDirect ? "Distribution created!" : "Proposal created!"}
          </p>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="distribution-token-type">Token Type</Label>
              <Controller
                name="tokenType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={TOKEN_TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    id="distribution-token-type"
                  />
                )}
              />
            </div>
            {watchedTokenType === TokenType.ERC20 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="distribution-token-address">Token Address</Label>
                <Input
                  id="distribution-token-address"
                  placeholder="0x..."
                  {...register("tokenAddress")}
                />
              </div>
            )}
            {isDirect ? (
              <p className="text-sm text-muted-foreground">
                Full balance of the selected token will be distributed to members.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="distribution-amount">Amount</Label>
                  <div className="flex gap-2">
                    <Input
                      id="distribution-amount"
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
                <AdvancedProposalOptions register={register} idPrefix="distribution-" />
              </>
            )}
            {!isMember && (
              <p className="text-sm text-destructive">
                Must be a member of party to submit proposal
              </p>
            )}
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName={isDirect ? "Create Distribution" : "Submit Proposal"}
              disabled={!isMember}
              onSuccess={() => setProposalCreated(true)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

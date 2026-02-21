import { type NetworkName, Party, Seaport } from "@party-forever/contracts";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formatUnits, parseEther } from "viem";

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
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";
import {
  computeSeaportFees,
  fetchOpenseaCollectionFees,
  type OpenseaFee
} from "@/lib/opensea_fees.ts";

interface OpenseaSaleProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember: boolean;
  initialTokenAddress?: string;
  initialTokenId?: string;
}

interface FormData {
  tokenAddress: string;
  tokenId: string;
  listPrice: string;
  durationDays: string;
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

export const OpenseaSaleProposalDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  isMember,
  initialTokenAddress,
  initialTokenId
}: OpenseaSaleProposalDialogProps) => {
  const [proposalCreated, setProposalCreated] = useState(false);
  const { account: walletAddress } = useAccount();

  const [fees, setFees] = useState<OpenseaFee[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);

  const { register, getValues, watch, reset } = useForm<FormData>({
    defaultValues: {
      tokenAddress: "",
      tokenId: "",
      listPrice: "",
      durationDays: "7",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    }
  });

  const watchedTokenAddress = watch("tokenAddress");
  const watchedTokenId = watch("tokenId");

  useEffect(() => {
    if (!open) {
      setProposalCreated(false);
      setFees([]);
      setFeesError(null);
      return;
    }
    reset({
      tokenAddress: initialTokenAddress ?? "",
      tokenId: initialTokenId ?? "",
      listPrice: "",
      durationDays: "7",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    });
  }, [open, initialTokenAddress, initialTokenId, reset]);

  const loadFees = useCallback(async () => {
    const addr = watchedTokenAddress.trim();
    const tid = watchedTokenId.trim();
    if (!addr.match(/^0x[a-fA-F0-9]{40}$/) || !tid) {
      setFees([]);
      setFeesError(null);
      return;
    }

    setFeesLoading(true);
    setFeesError(null);
    try {
      const result = await fetchOpenseaCollectionFees(network, addr, tid);
      setFees(result);
    } catch (e) {
      setFeesError(e instanceof Error ? e.message : "Failed to fetch fees");
      setFees([]);
    } finally {
      setFeesLoading(false);
    }
  }, [watchedTokenAddress, watchedTokenId, network]);

  // Auto-fetch fees when token address and ID are both present (e.g. pre-filled from inventory)
  useEffect(() => {
    if (!open) return;
    const addr = watchedTokenAddress.trim();
    const tid = watchedTokenId.trim();
    if (addr.match(/^0x[a-fA-F0-9]{40}$/) && tid) {
      loadFees();
    }
  }, [open, watchedTokenAddress, watchedTokenId, loadFees]);

  const totalFeeBps = fees.reduce((sum, f) => sum + f.feeBasisPoints, 0);

  const buildTx = async () => {
    const formValues = getValues();

    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    const tokenAddr = formValues.tokenAddress.trim();
    if (!tokenAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid NFT contract address");
    }

    const tokenIdStr = formValues.tokenId.trim();
    if (!tokenIdStr) {
      throw new Error("Token ID is required");
    }
    const tokenId = BigInt(tokenIdStr);

    const priceStr = formValues.listPrice.trim();
    if (!priceStr) {
      throw new Error("Sale price is required");
    }
    const priceNum = Number.parseFloat(priceStr);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      throw new Error("Sale price must be a positive number");
    }
    let listPriceWei: bigint;
    try {
      listPriceWei = parseEther(priceStr);
    } catch {
      throw new Error("Invalid sale price");
    }

    const durationDaysStr = formValues.durationDays.trim();
    const durationDays = Number.parseFloat(durationDaysStr);
    if (Number.isNaN(durationDays) || durationDays <= 0) {
      throw new Error("Listing duration must be a positive number of days");
    }
    const durationSeconds = Math.floor(durationDays * 24 * 60 * 60);

    const maxExecutableTimeDays = Number(formValues.maxExecutableTimeDays);
    if (Number.isNaN(maxExecutableTimeDays) || maxExecutableTimeDays <= 0) {
      throw new Error("Max executable time must be a positive number of days");
    }

    const cancelDelay = Number(formValues.cancelDelay);
    if (Number.isNaN(cancelDelay) || cancelDelay <= 0) {
      throw new Error("Cancel delay must be a positive number");
    }

    // Compute fee amounts and adjusted list price
    const { adjustedListPrice, feeAmounts, feeRecipients } = computeSeaportFees(listPriceWei, fees);

    const client = getClient(network);
    const party = await Party.create(network, partyAddress, client);
    const now = Math.floor(Date.now() / 1000);
    const maxExecutableTime = String(now + maxExecutableTimeDays * 24 * 60 * 60);
    const latestSnapIndex = await party.findVotingPowerSnapshotIndex(walletAddress, now);

    // Fetch the Seaport domain hash prefix
    const seaport = new Seaport(client);
    const domainHashPrefix = await seaport.getDomainHashPrefix();

    return party.generateOpenseaSaleProposalTx({
      listPrice: adjustedListPrice,
      duration: durationSeconds,
      token: tokenAddr as `0x${string}`,
      tokenId,
      fees: feeAmounts,
      feeRecipients,
      domainHashPrefix,
      maxExecutableTime,
      cancelDelay: String(cancelDelay),
      latestSnapIndex: latestSnapIndex.toString()
    });
  };

  const feeSummary = (() => {
    if (feesLoading) return "Loading fees...";
    if (feesError) return null;
    if (fees.length === 0) return "No marketplace or creator fees detected.";

    const listPriceStr = getValues("listPrice")?.trim();
    let feeDetail = `Total fees: ${(totalFeeBps / 100).toFixed(2)}%`;
    if (listPriceStr) {
      try {
        const priceWei = parseEther(listPriceStr);
        const { adjustedListPrice } = computeSeaportFees(priceWei, fees);
        const totalFeeWei = priceWei - adjustedListPrice;
        feeDetail += ` (${formatUnits(totalFeeWei, 18)} ETH)`;
      } catch {
        // Ignore parse errors for display
      }
    }
    return feeDetail;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>New OpenSea Sale Proposal</DialogTitle>
        <DialogDescription>
          Create a proposal to list the party&apos;s NFT for sale on OpenSea.
        </DialogDescription>
        {proposalCreated ? (
          <p className="text-sm font-medium text-green-600 mt-4">Proposal created!</p>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="opensea-token-address">NFT Contract Address</Label>
              <Input id="opensea-token-address" placeholder="0x..." {...register("tokenAddress")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="opensea-token-id">Token ID</Label>
              <Input
                id="opensea-token-id"
                type="text"
                inputMode="numeric"
                placeholder="0"
                {...register("tokenId")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="opensea-list-price">Sale Price (ETH)</Label>
              <Input
                id="opensea-list-price"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                {...register("listPrice")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="opensea-duration">Listing Duration (days)</Label>
              <Input
                id="opensea-duration"
                type="text"
                inputMode="decimal"
                placeholder="7"
                {...register("durationDays")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{feeSummary ?? ""}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadFees}
                  disabled={feesLoading}
                >
                  {feesLoading ? "Loading..." : fees.length > 0 ? "Refresh Fees" : "Fetch Fees"}
                </Button>
              </div>
              {feesError && <p className="text-sm text-destructive">{feesError}</p>}
            </div>
            <AdvancedProposalOptions register={register} idPrefix="opensea-" />
            {!isMember && (
              <p className="text-sm text-destructive">
                Must be a member of party to submit proposal
              </p>
            )}
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName="Submit Proposal"
              disabled={!isMember || feesLoading}
              onSuccess={() => setProposalCreated(true)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

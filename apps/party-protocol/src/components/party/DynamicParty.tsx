import { BondingCurveAuthority, Party, type NetworkName } from "@party-forever/contracts";
import { Button, Dialog, DialogContent, DialogTitle, Input } from "@party-forever/ui";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Web3Button, type Web3ButtonStatus } from "@/components/ui/Web3Button";
import { getClient } from "@/lib/client.ts";
import { formatEth } from "@/lib/format.ts";

interface DynamicPriceInfo {
  isSelling: boolean;
  totalPrice: bigint;
  totalQuantity: number;
}

interface DynamicPartyProps {
  network: NetworkName;
  partyAddress: `0x${string}`;
  authorityAddress: `0x${string}` | null;
  connectedAddress: `0x${string}` | undefined;
  membershipPrice: bigint | null;
  onSuccess?: () => void;
}

export const DynamicParty = ({
  network,
  partyAddress,
  authorityAddress,
  connectedAddress,
  membershipPrice,
  onSuccess
}: DynamicPartyProps) => {
  const [numPartyCards, setNumPartyCards] = useState(1);
  const [isSelling, setIsSelling] = useState(false);
  const [fetchedPriceInfo, setFetchedPriceInfo] = useState<DynamicPriceInfo | null>(null);
  const [authority, setAuthority] = useState<BondingCurveAuthority | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<Web3ButtonStatus>("idle");
  const [txSucceeded, setTxSucceeded] = useState(false);

  const client = useMemo(() => getClient(network), [network]);

  useEffect(() => {
    if (!authorityAddress) {
      setAuthority(null);
      return;
    }
    BondingCurveAuthority.create(network, authorityAddress, client).then(setAuthority);
  }, [network, authorityAddress, client]);

  const { data: userTokenIds = [], refetch: refetchTokenIds } = useQuery({
    queryKey: ["partyMember", connectedAddress, partyAddress, network],
    queryFn: async () => {
      if (!connectedAddress) return [];
      const party = await Party.create(network, partyAddress, client);
      return party.getTokenIdsOwnedByAddress(connectedAddress);
    },
    enabled: Boolean(connectedAddress && partyAddress)
  });

  const userBalance = userTokenIds.length;

  const refetchPriceInfo = useCallback(async () => {
    if (!authority) return;
    const totalQuantity = numPartyCards;
    const totalPrice = isSelling
      ? await authority.getSaleProceeds(partyAddress, BigInt(totalQuantity))
      : await authority.getPriceToBuy(partyAddress, BigInt(totalQuantity));
    setFetchedPriceInfo({
      isSelling,
      totalPrice,
      totalQuantity
    });
  }, [authority, partyAddress, numPartyCards, isSelling]);

  useEffect(() => {
    refetchPriceInfo();
  }, [refetchPriceInfo]);

  const loadingPrice = useMemo(() => {
    if (!fetchedPriceInfo) return true;
    return (
      fetchedPriceInfo.totalQuantity !== numPartyCards || fetchedPriceInfo.isSelling !== isSelling
    );
  }, [fetchedPriceInfo, numPartyCards, isSelling]);

  const getBuyTxData = useCallback(async () => {
    if (!authority || !connectedAddress || !fetchedPriceInfo) {
      throw new Error("Not ready to buy");
    }
    if (numPartyCards < 1) {
      throw new Error("Quantity must be at least 1");
    }
    const isBuying = !fetchedPriceInfo.isSelling;
    if (!isBuying || fetchedPriceInfo.totalQuantity !== numPartyCards) {
      throw new Error("Price info out of date; please wait");
    }
    const ethBalance = await client.getBalance({ address: connectedAddress });
    if (ethBalance < fetchedPriceInfo.totalPrice) {
      alert(
        `Insufficient ETH balance. You have ${formatEth(ethBalance)} ETH but need ${formatEth(fetchedPriceInfo.totalPrice)} ETH.`
      );
      throw new Error("Insufficient ETH balance");
    }
    return authority.getBuyPartyCardsTxData(
      partyAddress,
      BigInt(numPartyCards),
      connectedAddress,
      fetchedPriceInfo.totalPrice
    );
  }, [authority, partyAddress, connectedAddress, numPartyCards, fetchedPriceInfo, client]);

  const getSellTxData = useCallback(async () => {
    if (!authority || !fetchedPriceInfo) {
      throw new Error("Not ready to sell");
    }
    if (numPartyCards < 1 || numPartyCards > userTokenIds.length) {
      throw new Error(`You can sell between 1 and ${userTokenIds.length} memberships`);
    }
    if (!fetchedPriceInfo.isSelling || fetchedPriceInfo.totalQuantity !== numPartyCards) {
      throw new Error("Price info out of date; please wait");
    }
    const tokenIdsToSell = userTokenIds.slice(0, numPartyCards);
    return authority.getSellPartyCardsTxData(
      partyAddress,
      tokenIdsToSell,
      fetchedPriceInfo.totalPrice
    );
  }, [authority, partyAddress, numPartyCards, fetchedPriceInfo, userTokenIds]);

  const openBuy = () => {
    setIsSelling(false);
    setNumPartyCards(1);
    setTxStatus("idle");
    setTxSucceeded(false);
    setBuyDialogOpen(true);
  };

  const openSell = () => {
    setIsSelling(true);
    setNumPartyCards(1);
    setTxStatus("idle");
    setTxSucceeded(false);
    setSellDialogOpen(true);
  };

  const pricePerMembership =
    fetchedPriceInfo && fetchedPriceInfo.totalQuantity > 0
      ? fetchedPriceInfo.totalPrice / BigInt(fetchedPriceInfo.totalQuantity)
      : 0n;

  const buyTotalCost =
    fetchedPriceInfo && !fetchedPriceInfo.isSelling ? fetchedPriceInfo.totalPrice : 0n;

  const sellTotalAmount =
    fetchedPriceInfo && fetchedPriceInfo.isSelling ? fetchedPriceInfo.totalPrice : 0n;

  const inputDisabled = txStatus === "loading" || txStatus === "success";

  const handleBuyDialogChange = (open: boolean) => {
    setBuyDialogOpen(open);
    if (!open && txSucceeded) {
      refetchTokenIds();
      onSuccess?.();
    }
  };

  const handleSellDialogChange = (open: boolean) => {
    setSellDialogOpen(open);
    if (!open && txSucceeded) {
      refetchTokenIds();
      onSuccess?.();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {membershipPrice !== null && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Current Membership Price</p>
          <p className="flex items-center gap-2 text-lg font-semibold">
            <span className="size-5 shrink-0 rounded bg-[#627EEA]" title="ETH" />
            {formatEth(membershipPrice)} ETH
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="default" onClick={openBuy}>
          Buy Memberships
        </Button>
        {userBalance > 0 ? (
          <Button variant="default" onClick={openSell}>
            Sell Memberships
          </Button>
        ) : (
          connectedAddress && (
            <span className="text-sm text-muted-foreground">You do not own any memberships</span>
          )
        )}
      </div>

      <Dialog open={buyDialogOpen} onOpenChange={handleBuyDialogChange}>
        <DialogContent className="flex flex-col gap-4">
          <DialogTitle>Buy Memberships</DialogTitle>

          <div className="flex flex-col gap-2">
            <Input
              type="number"
              min={1}
              value={numPartyCards}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNumPartyCards(Number(e.target.value))
              }
              disabled={inputDisabled}
            />
            <p className="text-center text-sm text-muted-foreground">
              {loadingPrice ? "Loading…" : `${formatEth(pricePerMembership)} ETH per membership`}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="flex items-center gap-2 text-lg font-semibold">
              <span className="size-5 shrink-0 rounded bg-[#627EEA]" title="ETH" />
              {loadingPrice ? "—" : formatEth(buyTotalCost)} ETH
            </p>
          </div>

          <Web3Button
            networkName={network}
            txnFn={getBuyTxData}
            actionName="Buy"
            onSuccess={() => setTxSucceeded(true)}
            onStatusChange={setTxStatus}
            disabled={loadingPrice || buyTotalCost === 0n}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={sellDialogOpen} onOpenChange={handleSellDialogChange}>
        <DialogContent className="flex flex-col gap-4">
          <DialogTitle>Sell Memberships</DialogTitle>

          <div className="flex flex-col gap-2">
            <Input
              type="number"
              min={1}
              max={userBalance}
              value={numPartyCards}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNumPartyCards(Math.min(Number(e.target.value), userBalance))
              }
              disabled={inputDisabled}
            />
            <p className="text-center text-sm text-muted-foreground">
              {loadingPrice ? "Loading…" : `${formatEth(pricePerMembership)} ETH per membership`}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">Total Sale Amount</p>
            <p className="flex items-center gap-2 text-lg font-semibold">
              <span className="size-5 shrink-0 rounded bg-[#627EEA]" title="ETH" />
              {loadingPrice ? "—" : formatEth(sellTotalAmount)} ETH
            </p>
          </div>

          <Web3Button
            networkName={network}
            txnFn={getSellTxData}
            actionName="Sell"
            onSuccess={() => setTxSucceeded(true)}
            onStatusChange={setTxStatus}
            disabled={loadingPrice || sellTotalAmount === 0n}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

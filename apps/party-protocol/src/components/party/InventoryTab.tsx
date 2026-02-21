import type { NetworkName } from "@party-forever/contracts";
import { useState } from "react";

import { NFTInventory } from "@/components/party/NFTInventory";
import { isSpamToken, TokenInventory } from "@/components/party/TokenInventory";
import {
  type Alchemy_NftV3,
  createAlchemyClient,
  getAllNftsForOwner,
  getTokenBalancesWithMetadata,
  type TokenWithMetadata
} from "@/external/alchemy";
import { getClient } from "@/lib/client.ts";

const ALCHEMY_ERROR_PREFIX =
  "Alchemy API is unavailable. Token/NFT inventory may be temporarily inaccessible. Other functionality is unaffected.";

function sortTokensWithSpamLast(tokens: TokenWithMetadata[]): TokenWithMetadata[] {
  const normal: TokenWithMetadata[] = [];
  const spam: TokenWithMetadata[] = [];
  for (const t of tokens) {
    if (isSpamToken(t)) {
      spam.push(t);
    } else {
      normal.push(t);
    }
  }
  return [...normal, ...spam];
}

interface InventoryTabProps {
  partyAddress: `0x${string}`;
  network: NetworkName;
  isMember?: boolean;
  onOpenSendNftDialog?: (nftContractAddress: string, nftTokenId: string) => void;
  onOpenSendTokenDialog?: (tokenAddress: string, decimals: number) => void;
  onOpenDistributionDialog?: (tokenAddress?: string, amount?: string) => void;
  onOpenOpenseaSaleDialog?: (nftContractAddress: string, nftTokenId: string) => void;
  isNftParty?: boolean;
}

export const InventoryTab = ({
  partyAddress,
  network,
  isMember,
  onOpenSendNftDialog,
  onOpenSendTokenDialog,
  onOpenDistributionDialog,
  onOpenOpenseaSaleDialog,
  isNftParty
}: InventoryTabProps) => {
  const [tokens, setTokens] = useState<TokenWithMetadata[] | null>(null);
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nfts, setNfts] = useState<Alchemy_NftV3[] | null>(null);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [nftsError, setNftsError] = useState<string | null>(null);

  const handleLoadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const viemClient = getClient(network);
      const balance = await viemClient.getBalance({ address: partyAddress });
      setEthBalance(balance);

      try {
        const alchemyClient = createAlchemyClient(network);
        const result = await getTokenBalancesWithMetadata(alchemyClient, partyAddress);
        setTokens(sortTokensWithSpamLast(result));
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        setError(`${ALCHEMY_ERROR_PREFIX}\n${detail}`);
        setTokens([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setTokens(null);
      setEthBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadNfts = async () => {
    setNftsLoading(true);
    setNftsError(null);
    try {
      const client = createAlchemyClient(network);
      const result = await getAllNftsForOwner(client, partyAddress);
      setNfts(result);
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setNftsError(`${ALCHEMY_ERROR_PREFIX}\n${detail}`);
      setNfts(null);
    } finally {
      setNftsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLoadInventory}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Load token inventory"}
        </button>
        <button
          type="button"
          onClick={handleLoadNfts}
          disabled={nftsLoading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {nftsLoading ? "Loading…" : "Load NFTs"}
        </button>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      {nftsError && (
        <p className="text-destructive text-sm" role="alert">
          {nftsError}
        </p>
      )}

      {tokens !== null && (
        <TokenInventory
          tokens={tokens}
          ethBalance={ethBalance ?? undefined}
          network={network}
          onOpenSendTokenDialog={onOpenSendTokenDialog}
          onOpenDistributionDialog={onOpenDistributionDialog}
        />
      )}

      {nfts !== null && (
        <NFTInventory
          nfts={nfts}
          network={network}
          partyAddress={partyAddress}
          isMember={isMember}
          onOpenSendNftDialog={onOpenSendNftDialog}
          onOpenOpenseaSaleDialog={onOpenOpenseaSaleDialog}
          isNftParty={isNftParty}
        />
      )}
    </div>
  );
};

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getAddress } from "viem";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorDisplay,
  ExternalLinkIcon,
  Loading,
  resolveIpfsUrl
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { createAlchemyClient } from "@/lib/alchemy.ts";
import {
  getPartyNftsOwnedByAccount,
  getPartyTokenBalancesForAccount,
  type NFTRecord,
  type TokenRecord
} from "@/lib/owned_by_account.ts";
import type { TokenPageNetwork } from "@/lib/constants.ts";
import { getTokenLifecycle } from "@/lib/party_token_launcher.ts";
import { getOpenseaCollectionUrl } from "@party-forever/externals";

const network: TokenPageNetwork = "base";

type NftCollectionGroup = {
  nftContract: string;
  name: string;
  imageURI: string;
  count: number;
};

const groupNftsByCollection = (nfts: NFTRecord[]): NftCollectionGroup[] => {
  const byContract = new Map<string, NFTRecord[]>();
  for (const nft of nfts) {
    const key = nft.nftContract.toLowerCase();
    const list = byContract.get(key) ?? [];
    list.push(nft);
    byContract.set(key, list);
  }
  return [...byContract.values()].map((list) => {
    const first = list[0];
    return {
      nftContract: first.nftContract,
      name: first.name,
      imageURI: first.imageURI,
      count: list.length
    };
  });
};

const NftCollectionCard = ({ collection }: { collection: NftCollectionGroup }) => {
  const href = getOpenseaCollectionUrl(network, collection.nftContract);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg border border-party-card-border p-3 hover:bg-white/5 hover:border-party-accent/25 transition-all duration-200"
    >
      <div className="relative aspect-square w-full rounded-md overflow-hidden bg-muted/30">
        <img
          src={resolveIpfsUrl(collection.imageURI)}
          alt={collection.name}
          className="h-full w-full object-cover"
        />
        {collection.count > 1 && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {collection.count} NFTs
          </span>
        )}
      </div>
      <span className="font-medium truncate" title={collection.name}>
        {collection.name}
      </span>
      <span className="text-muted-foreground text-xs flex items-center gap-1">
        View on OpenSea
        <ExternalLinkIcon />
      </span>
    </a>
  );
};

const TokenCard = ({ token }: { token: TokenRecord }) => (
  <Link
    to={`/${token.token}`}
    className="flex flex-col gap-2 rounded-lg border border-party-card-border p-3 hover:bg-white/5 hover:border-party-accent/25 transition-all duration-200"
  >
    <img
      src={resolveIpfsUrl(token.tokenImage)}
      alt={token.tokenName}
      className="aspect-square w-full rounded-md object-cover"
    />
    <span className="font-medium truncate" title={token.tokenName}>
      {token.tokenName}
    </span>
    <span className="text-muted-foreground text-xs">{token.tokenSymbol}</span>
  </Link>
);

export const Profile = () => {
  const { userAddress: rawAddress } = useParams<{ userAddress: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [normalizedAddress, setNormalizedAddress] = useState<string | null>(null);
  const [nfts, setNfts] = useState<NFTRecord[] | null>(null);
  const [nftsLoading, setNftsLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [tokenLifecycles, setTokenLifecycles] = useState<
    Record<string, "active" | "finalized" | null>
  >({});
  const [tokenLifecyclesLoading, setTokenLifecyclesLoading] = useState(false);
  const [showNfts, setShowNfts] = useState(false);
  const [showTokens, setShowTokens] = useState(true);

  useEffect(() => {
    if (!rawAddress?.trim()) {
      setError("Missing address");
      setLoading(false);
      return;
    }
    try {
      setNormalizedAddress(getAddress(rawAddress.trim()));
    } catch {
      setError("Invalid Ethereum address");
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);
    const run = async () => {
      try {
        const client = createAlchemyClient(network);
        const addr = getAddress(rawAddress.trim());
        const tokenList = await getPartyTokenBalancesForAccount(client, addr);
        setTokens(tokenList);
      } catch (e) {
        const detail = e instanceof Error ? e.message : String(e);
        setError(
          `Alchemy API is unavailable — token balances could not be loaded. Other functionality is unaffected. (${detail})`
        );
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [rawAddress]);

  useEffect(() => {
    if (tokens.length === 0) {
      setTokenLifecycles({});
      setTokenLifecyclesLoading(false);
      return;
    }
    setTokenLifecyclesLoading(true);
    (async () => {
      const results = await Promise.all(
        tokens.map(async (t) => {
          const lifecycle = await getTokenLifecycle(network, t.token as `0x${string}`);
          return [getAddress(t.token), lifecycle] as const;
        })
      );
      setTokenLifecycles(Object.fromEntries(results));
      setTokenLifecyclesLoading(false);
    })();
  }, [tokens]);

  const launchedTokens = tokens.filter(
    (t) =>
      tokenLifecycles[getAddress(t.token)] === "finalized" ||
      tokenLifecycles[getAddress(t.token)] === null
  );
  const crowdfundTokens = tokens.filter((t) => tokenLifecycles[getAddress(t.token)] === "active");

  const loadNfts = () => {
    if (nfts !== null) {
      setShowNfts((v) => !v);
      return;
    }
    if (nftsLoading) {
      setShowNfts(true);
      return;
    }
    const addr = normalizedAddress ?? (rawAddress?.trim() ? getAddress(rawAddress.trim()) : null);
    if (!addr) return;
    setShowNfts(true);
    setNftsLoading(true);
    (async () => {
      try {
        const client = createAlchemyClient(network);
        const nftList = await getPartyNftsOwnedByAccount(client, addr);
        setNfts(nftList);
      } catch {
        setNfts(null);
        setError(
          "Alchemy API is unavailable — NFTs could not be loaded. Other functionality is unaffected."
        );
      } finally {
        setNftsLoading(false);
      }
    })();
  };

  if (error && !normalizedAddress) {
    return <ErrorDisplay message={error} backLink="/" backLabel="Back to search" />;
  }

  if (loading) {
    return <Loading message="Loading profile…" />;
  }

  const nftCollectionCount = nfts && nfts.length > 0 ? groupNftsByCollection(nfts).length : 0;

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/">
          <Button variant="ghost">← Back to search</Button>
        </Link>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          {normalizedAddress && (
            <p className="text-sm pt-2">
              <EtherscanLink network={network} address={normalizedAddress} addressType="address" />
            </p>
          )}
        </CardHeader>
      </Card>

      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={loadNfts}
          aria-expanded={showNfts}
          disabled={nftsLoading}
        >
          {nftsLoading ? "Loading NFTs…" : showNfts ? "Hide NFTs" : "Show NFTs"}
          {!nftsLoading && nfts !== null && nftCollectionCount > 0 && (
            <span className="ml-2 text-muted-foreground">
              ({nftCollectionCount} collection{nftCollectionCount === 1 ? "" : "s"})
            </span>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowTokens((v) => !v)}
          aria-expanded={showTokens}
        >
          {showTokens ? "Hide Tokens" : "Show Tokens"}
          {tokens.length > 0 && (
            <span className="ml-2 text-muted-foreground">({tokens.length})</span>
          )}
        </Button>
      </div>

      {showNfts && (
        <Card>
          <CardHeader>
            <CardTitle>NFTs</CardTitle>
            <CardDescription>Party NFTs you own. Open on OpenSea to view or trade.</CardDescription>
          </CardHeader>
          <CardContent>
            {nftsLoading ? (
              <p className="text-muted-foreground text-sm">Loading NFTs…</p>
            ) : nfts === null ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : nfts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No Party NFTs found for this address.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {groupNftsByCollection(nfts).map((collection) => (
                  <NftCollectionCard key={collection.nftContract} collection={collection} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showTokens && (
        <Card>
          <CardHeader>
            <CardTitle>Tokens</CardTitle>
            <CardDescription>
              Party tokens you hold. Open to view, buy, or sell on this app.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {tokens.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No Party tokens found for this address.
              </p>
            ) : tokenLifecyclesLoading ? (
              <p className="text-muted-foreground text-sm">Loading token status…</p>
            ) : (
              <>
                {crowdfundTokens.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">In crowdfund</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {crowdfundTokens.map((t) => (
                        <TokenCard key={t.token} token={t} />
                      ))}
                    </div>
                  </div>
                )}
                {launchedTokens.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Launched (trade on Uniswap)
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {launchedTokens.map((t) => (
                        <TokenCard key={t.token} token={t} />
                      ))}
                    </div>
                  </div>
                )}
                {launchedTokens.length === 0 && crowdfundTokens.length === 0 && (
                  <p className="text-muted-foreground text-sm">No token status available.</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import type { NetworkName, Party } from "@party-forever/contracts";
import { ETH_SENTINEL_ADDRESS, PartyHelpers } from "@party-forever/contracts";
import { useCallback, useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Label,
  Switch,
  Textarea
} from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { createAlchemyClient, getTokenBalancesWithMetadata } from "@/external/alchemy";
import { getClient } from "@/lib/client.ts";
import { formatTokenAmount } from "@/lib/format.ts";
import { sortAddresses } from "@/lib/utils.ts";
import type { TokenWithMetadata } from "@/external/alchemy.ts";

/**
 * The rageQuit contract requires minWithdrawAmounts slightly below exact amounts
 * to avoid reverts from on-chain rounding. This divisor gives ~0.0000000001% tolerance:
 * minWithdrawAmount = amount - (amount / MIN_WITHDRAW_SLIPPAGE_DIVISOR).
 */
const MIN_WITHDRAW_SLIPPAGE_DIVISOR = 1_000_000_000_000n;

type RageQuitAsset = {
  address: `0x${string}`;
  amountWei: bigint;
  symbol: string;
  name: string;
  decimals: number;
  logo: string | null;
  selected: boolean;
};

function generateRageQuitAssets(
  withdrawTokenAddresses: `0x${string}`[],
  withdrawAmounts: bigint[],
  tokensWithMetadata: TokenWithMetadata[]
): RageQuitAsset[] {
  return withdrawTokenAddresses.map((address, i) => {
    const amountWei = withdrawAmounts[i] ?? 0n;
    if (address.toLowerCase() === ETH_SENTINEL_ADDRESS.toLowerCase()) {
      return {
        address,
        amountWei,
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        logo: null,
        selected: true
      };
    }
    const tokenWithMetadata = tokensWithMetadata.find(
      (t) => t.contractAddress.toLowerCase() === address.toLowerCase()
    );
    return {
      address,
      amountWei,
      symbol: tokenWithMetadata?.symbol ?? address,
      name: address,
      decimals: 18,
      logo: null,
      selected: true
    };
  });
}

interface RageQuitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  receiverAddress: `0x${string}`;
  tokenIds: bigint[];
  onSuccess?: () => void;
  party: Party;
}

export const RageQuitDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  receiverAddress,
  tokenIds,
  onSuccess,
  party
}: RageQuitDialogProps) => {
  const [assets, setAssets] = useState<RageQuitAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingAlchemy, setFetchingAlchemy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [tokenAddressInput, setTokenAddressInput] = useState("");
  /** True when user ran "Calculate" and party has no tokens to withdraw (allows rage quit with zero assets). */
  const [noAssetsToClaim, setNoAssetsToClaim] = useState(false);
  const [tokensWithMetadata, setTokensWithMetadata] = useState<TokenWithMetadata[]>([]);

  useEffect(() => {
    if (!open) return;
    setSupported(null);
    setEthBalance(null);
    setError(null);
    setNoAssetsToClaim(false);

    (async () => {
      try {
        const balance = await getClient(network).getBalance({ address: partyAddress });
        setSupported(party.supportsRageQuitWithdrawSelection());
        setEthBalance(balance);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [open, network, partyAddress, party]);

  const handleAddTokens = useCallback(async () => {
    if (ethBalance === null) return;
    setLoading(true);
    setError(null);
    try {
      const client = getClient(network);
      const erc20Addresses = tokenAddressInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => /^0x[a-fA-F0-9]{40}$/.test(line))
        .map((addr) => addr as `0x${string}`);

      const withdrawTokenAddresses: `0x${string}`[] = [];
      if (ethBalance > 0n) {
        withdrawTokenAddresses.push(ETH_SENTINEL_ADDRESS);
      }
      for (const addr of erc20Addresses) {
        withdrawTokenAddresses.push(addr);
      }

      if (withdrawTokenAddresses.length === 0) {
        setAssets([]);
        setNoAssetsToClaim(true);
        setLoading(false);
        return;
      }

      const partyHelpers = new PartyHelpers(network, client);
      const withdrawAmounts = await partyHelpers.getRageQuitWithdrawAmounts(
        partyAddress,
        tokenIds,
        withdrawTokenAddresses
      );

      setNoAssetsToClaim(false);
      setAssets(
        generateRageQuitAssets(withdrawTokenAddresses, withdrawAmounts, tokensWithMetadata)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [network, partyAddress, tokenIds, ethBalance, tokenAddressInput, tokensWithMetadata]);

  const handleFetchFromAlchemy = useCallback(async () => {
    setFetchingAlchemy(true);
    setError(null);
    try {
      const alchemy = createAlchemyClient(network);
      const erc20Tokens = await getTokenBalancesWithMetadata(alchemy, partyAddress);
      setTokensWithMetadata(erc20Tokens);
      const addresses = erc20Tokens
        .filter((t: TokenWithMetadata) => BigInt(t.tokenBalance) > 0n)
        .map((t: TokenWithMetadata) => t.contractAddress);
      setTokenAddressInput(addresses.join("\n"));
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e);
      setError(
        `Alchemy API is unavailable — could not auto-fetch token addresses. You can still enter them manually below. (${detail})`
      );
    } finally {
      setFetchingAlchemy(false);
    }
  }, [network, partyAddress]);

  const toggle = (address: string) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.address.toLowerCase() === address.toLowerCase() ? { ...a, selected: !a.selected } : a
      )
    );
  };

  const buildTx = useCallback(async () => {
    const txData = party.getRageQuitTxData(tokenIds, [], [], receiverAddress);
    if (!txData) throw new Error("Rage quit not supported");

    if (noAssetsToClaim || assets.length === 0) {
      return txData;
    }

    const selectedAssets = assets.filter((a) => a.selected);
    if (selectedAssets.length === 0) throw new Error("Select at least one asset");

    const sortedAddr = sortAddresses(selectedAssets.map((a) => a.address));
    const addressToAsset = new Map(selectedAssets.map((a) => [a.address.toLowerCase(), a]));
    const sortedMinWithdrawAmounts: bigint[] = sortedAddr.map((addr) => {
      const a = addressToAsset.get(addr.toLowerCase())!;
      const slippageDeduction = a.amountWei / MIN_WITHDRAW_SLIPPAGE_DIVISOR;
      return a.amountWei - slippageDeduction;
    });

    return party.getRageQuitTxData(
      tokenIds,
      sortedAddr,
      sortedMinWithdrawAmounts,
      receiverAddress
    )!;
  }, [party, assets, tokenIds, receiverAddress, noAssetsToClaim]);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const initializing = supported === null || ethBalance === null;
  const noTokensSelected = assets.length > 0 && !assets.some((a) => a.selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md flex flex-col gap-4">
        <DialogTitle>Are you sure you want to Rage Quit?</DialogTitle>
        <DialogDescription asChild>
          <div className="flex gap-3 flex-col rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p className="">
              Rage Quitting will burn your Party membership in exchange for your share of all ETH
              and ERC-20 tokens in the Party.
            </p>
            <p>
              Populate the list of tokens you want to claim from the party. Enter manually or Fetch
              from Alchemy. If there are no tokens to claim, proceed to the next step
            </p>
            <p>
              Once you are satisfied with the list, click &quot;Calculate Withdraw Amounts&quot; to
              see the exact amounts you will receive.
            </p>
          </div>
        </DialogDescription>

        {error && <p className="text-destructive text-sm">{error}</p>}

        {initializing && !error && <p className="text-muted-foreground text-sm">Loading...</p>}

        {supported === false && (
          <p className="text-destructive text-sm">
            This party does not support selecting assets for rage quit.
          </p>
        )}

        {supported && ethBalance !== null && assets.length === 0 && !noAssetsToClaim && (
          <div className="flex flex-col gap-3">
            {ethBalance > 0n && (
              <p className="text-sm text-muted-foreground">
                ETH balance detected and will be included automatically.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="rage-quit-tokens">ERC-20 token addresses (one per line)</Label>
              <Textarea
                id="rage-quit-tokens"
                placeholder={"0x...\n0x..."}
                rows={4}
                value={tokenAddressInput}
                onChange={(e) => setTokenAddressInput(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" onClick={handleAddTokens} disabled={loading}>
                {loading ? "Loading..." : "Calculate Withdraw Amounts"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleFetchFromAlchemy}
                disabled={fetchingAlchemy}
              >
                {fetchingAlchemy ? "Fetching..." : "Fetch from Alchemy"}
              </Button>
            </div>
          </div>
        )}

        {noAssetsToClaim && (
          <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <p>
              Party has no ETH or tokens to claim. You can still rage quit to burn your membership.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => setNoAssetsToClaim(false)}
            >
              Back to token entry
            </Button>
          </div>
        )}

        {assets.length > 0 && (
          <>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">Select assets to claim</h3>
              <p className="text-muted-foreground text-xs">
                De-select assets you don&apos;t want to receive in order to save gas. NFTs are not
                accounted for.
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssets((prev) => prev.map((a) => ({ ...a, selected: true })))}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAssets((prev) => prev.map((a) => ({ ...a, selected: false })))}
                >
                  Deselect all
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {noTokensSelected && (
                <p className="text-destructive text-xs font-semibold">
                  Please select at least one token
                </p>
              )}
              {assets.map((a) => (
                <div
                  key={a.address.toLowerCase()}
                  className="flex items-center justify-between gap-4 rounded-md border bg-card p-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {a.logo && (
                      <img
                        src={a.logo}
                        alt=""
                        className="size-6 shrink-0 rounded-full object-cover"
                      />
                    )}
                    {a.address.toLowerCase() === ETH_SENTINEL_ADDRESS.toLowerCase() && (
                      <div className="size-6 shrink-0 rounded-full bg-[#627EEA]" title="ETH" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.symbol}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        Receive {formatTokenAmount(a.amountWei, a.decimals)} {a.symbol}
                      </p>
                    </div>
                  </div>
                  <Switch checked={a.selected} onCheckedChange={() => toggle(a.address)} />
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setAssets([]);
                setNoAssetsToClaim(false);
              }}
            >
              Back to token entry
            </Button>
          </>
        )}

        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <span className="text-destructive shrink-0 text-lg" aria-hidden>
            !
          </span>
          <p className="text-destructive text-sm">
            This action is permanent and cannot be undone. It may not cover NFTs or other value owed
            to the Party. Be sure you understand the risks before confirming.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Web3Button
            networkName={network}
            txnFn={buildTx}
            actionName="Confirm Rage Quit"
            onSuccess={handleSuccess}
            variant="destructive"
            disabled={
              loading ||
              (assets.length > 0 && noTokensSelected) ||
              (assets.length === 0 && !noAssetsToClaim)
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

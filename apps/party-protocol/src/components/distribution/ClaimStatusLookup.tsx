import { type NetworkName, Party, TokenDistributor } from "@party-forever/contracts";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { isAddress } from "viem";

import { Button, Input, Label, Select, type SelectOption, useAccount } from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

interface ClaimStatusLookupProps {
  networkName: NetworkName;
  distributorAddress: `0x${string}`;
  partyAddress: `0x${string}`;
  distributionId: bigint;
}

interface ClaimButtonProps {
  networkName: NetworkName;
  distributorAddress: `0x${string}`;
  partyAddress: `0x${string}`;
  distributionId: bigint;
  tokenId: bigint;
}

const ClaimButton = ({
  networkName,
  distributorAddress,
  partyAddress,
  distributionId,
  tokenId
}: ClaimButtonProps) => {
  const { account: connectedAddress } = useAccount();

  const txnFn = async () => {
    const client = getClient(networkName);
    const party = await Party.create(networkName, partyAddress, client);
    const owner = await party.ownerOf(tokenId);
    if (owner.toLowerCase() !== connectedAddress?.toLowerCase()) {
      throw new Error(`Not owner of token #${tokenId.toString()}`);
    }
    const tokenDistributor = TokenDistributor.create(networkName, client);
    return tokenDistributor.claimTx(distributorAddress, partyAddress, distributionId, tokenId);
  };

  return <Web3Button networkName={networkName} actionName="Claim" txnFn={txnFn} />;
};

type LookupMode = "tokenIds" | "address";

const LOOKUP_MODE_OPTIONS: SelectOption[] = [
  { value: "tokenIds", label: "Token IDs" },
  { value: "address", label: "Owner Address" }
];

interface FormData {
  lookupMode: LookupMode;
  tokenIds: string;
  ownerAddress: string;
}

type ClaimStatus = "claimed" | "not_claimed" | "invalid";

interface ClaimResult {
  tokenId: bigint;
  status: ClaimStatus;
}

type GetTokenIdsResult =
  | { success: true; tokenIds: bigint[] }
  | { success: false; errorMessage: string };

async function getTokenIds(data: FormData, party: Party): Promise<GetTokenIdsResult> {
  if (data.lookupMode === "address") {
    const trimmedAddress = data.ownerAddress.trim();
    if (!trimmedAddress) {
      return { success: false, errorMessage: "Please enter an address" };
    }
    if (!isAddress(trimmedAddress)) {
      return {
        success: false,
        errorMessage: "Invalid Ethereum address format"
      };
    }

    const tokenIds = await party.getTokenIdsOwnedByAddress(trimmedAddress as `0x${string}`);

    if (tokenIds.length === 0) {
      return {
        success: false,
        errorMessage: "No tokens found for this address"
      };
    }

    return { success: true, tokenIds };
  }

  const tokenIdStrings = data.tokenIds
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (tokenIdStrings.length === 0) {
    return {
      success: false,
      errorMessage: "Please enter at least one token ID"
    };
  }

  const tokenIds: bigint[] = [];
  for (const str of tokenIdStrings) {
    try {
      tokenIds.push(BigInt(str));
    } catch {
      return { success: false, errorMessage: `Invalid token ID: ${str}` };
    }
  }

  return { success: true, tokenIds };
}

export const ClaimStatusLookup = ({
  networkName,
  distributorAddress,
  partyAddress,
  distributionId
}: ClaimStatusLookupProps) => {
  const { account: connectedAddress } = useAccount();
  const [results, setResults] = useState<ClaimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoLookedUp = useRef(false);

  const { register, handleSubmit, control, watch, setValue } = useForm<FormData>({
    defaultValues: {
      lookupMode: "address",
      tokenIds: "",
      ownerAddress: connectedAddress ?? ""
    }
  });

  const lookupMode = watch("lookupMode");

  const performLookup = useCallback(
    async (data: FormData, { silent }: { silent: boolean }) => {
      setError(null);
      setResults([]);
      setLoading(true);

      try {
        const client = getClient(networkName);
        const tokenDistributor = TokenDistributor.create(networkName, client);
        const party = await Party.create(networkName, partyAddress, client);

        const result = await getTokenIds(data, party);
        if (!result.success) {
          if (!silent) {
            setError(result.errorMessage);
          }
          setLoading(false);
          return;
        }

        const { tokenIds } = result;

        const [ownerMap, claimedMap] = await Promise.all([
          party.tokensHaveOwners(tokenIds),
          tokenDistributor.havePartyTokenIdsClaimed(
            distributorAddress,
            partyAddress,
            tokenIds,
            distributionId
          )
        ]);

        const claimResults: ClaimResult[] = tokenIds.map((tokenId) => {
          const hasOwner = ownerMap.get(tokenId) ?? false;
          if (!hasOwner) {
            return { tokenId, status: "invalid" };
          }
          const claimed = claimedMap.get(tokenId) ?? false;
          return { tokenId, status: claimed ? "claimed" : "not_claimed" };
        });

        setResults(claimResults);
      } catch (e) {
        if (!silent) {
          setError(String(e));
        }
      } finally {
        setLoading(false);
      }
    },
    [networkName, distributorAddress, partyAddress, distributionId]
  );

  useEffect(() => {
    if (connectedAddress && !hasAutoLookedUp.current) {
      hasAutoLookedUp.current = true;
      setValue("ownerAddress", connectedAddress);
      performLookup(
        { lookupMode: "address", ownerAddress: connectedAddress, tokenIds: "" },
        { silent: true }
      );
    }
  }, [connectedAddress, performLookup, setValue]);

  const onSubmit = (data: FormData) => performLookup(data, { silent: false });

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
        <div className="space-y-1">
          <Label htmlFor="lookup-mode">Lookup By</Label>
          <Controller
            name="lookupMode"
            control={control}
            render={({ field }) => (
              <Select
                options={LOOKUP_MODE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                id="lookup-mode"
                className="w-36"
              />
            )}
          />
        </div>

        {lookupMode === "tokenIds" ? (
          <div className="space-y-1">
            <Label htmlFor="token-ids">Token IDs</Label>
            <Input id="token-ids" placeholder="1,4,5" className="w-40" {...register("tokenIds")} />
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="owner-address">Owner Address</Label>
            <Input
              id="owner-address"
              placeholder="0x..."
              className="w-80"
              {...register("ownerAddress")}
            />
          </div>
        )}

        <div className="flex items-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Looking up..." : "Look Up"}
          </Button>
        </div>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {results.length > 0 && (
        <table className="text-sm border border-border rounded">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 px-3 text-left">Token ID</th>
              <th className="py-2 px-3 text-left">Status</th>
              <th className="py-2 px-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr
                key={result.tokenId.toString()}
                className="border-b border-border last:border-b-0"
              >
                <td className="py-2 px-3">{result.tokenId.toString()}</td>
                <td className="py-2 px-3">
                  {result.status === "claimed" && <span className="text-green-600">Claimed</span>}
                  {result.status === "not_claimed" && (
                    <span className="text-red-600">Not Claimed</span>
                  )}
                  {result.status === "invalid" && (
                    <span className="text-muted-foreground">Invalid</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {result.status === "not_claimed" && (
                    <ClaimButton
                      networkName={networkName}
                      distributorAddress={distributorAddress}
                      partyAddress={partyAddress}
                      distributionId={distributionId}
                      tokenId={result.tokenId}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

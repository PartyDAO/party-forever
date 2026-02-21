import { Crowdfund, type NetworkName, Party } from "@party-forever/contracts";
import * as RadioGroup from "@radix-ui/react-radio-group";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorDisplay,
  Loading
} from "@party-forever/ui";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { formatEther } from "viem";
import { useParams } from "react-router";
import { Link } from "react-router";

import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";

import { NETWORK_ID_TO_NAME } from "@/lib/constants.ts";
import { getClient } from "@/lib/client.ts";
import { getDbPartyProtocolClient } from "@/lib/db_party_protocol_client.ts";

type SortField = "name" | "contribution";
type SortDir = "asc" | "desc";
type FilterMode = "all" | "claimable" | "rageQuitEnabled";

const NON_ACTIVE_STATUSES = ["WON", "FINALIZED", "LOST", "EXPIRED"];

interface ClaimableInfo {
  unactivated: boolean;
  ethOwed: bigint | null;
}

export const Profile = () => {
  const { address } = useParams<{ address: string }>();
  const [sortField, setSortField] = useState<SortField>("contribution");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["profile-contributions", address],
    queryFn: () => getDbPartyProtocolClient().getContributionSummaries(address!),
    enabled: !!address
  });

  const {
    data: manualMemberships,
    isLoading: isLoadingMemberships,
    error: membershipsError
  } = useQuery({
    queryKey: ["profile-manual-memberships", address],
    queryFn: () => getDbPartyProtocolClient().getManualPartyMemberships(address!),
    enabled: !!address
  });

  const contributions = data ?? [];

  const nonActive = useMemo(
    () => contributions.filter((c) => c.status && NON_ACTIVE_STATUSES.includes(c.status)),
    [contributions]
  );

  const { data: claimableMap, isFetching: isLoadingClaimable } = useQuery({
    queryKey: [
      "profile-claimable",
      address,
      nonActive
        .map((c) => `${c.networkId}:${c.crowdfundAddress}`)
        .sort()
        .join(",")
    ],
    queryFn: async (): Promise<Map<string, ClaimableInfo>> => {
      const result = new Map<string, ClaimableInfo>();
      const owner = address as `0x${string}`;

      const byNetwork = new Map<string, typeof nonActive>();
      for (const c of nonActive) {
        const network = NETWORK_ID_TO_NAME[c.networkId];
        if (!network) continue;
        const list = byNetwork.get(network) ?? [];
        list.push(c);
        byNetwork.set(network, list);
      }

      await Promise.all(
        [...byNetwork.entries()].map(async ([network, crowdfunds]) => {
          const client = getClient(network as NetworkName);
          const instances = await Crowdfund.createMulti(
            network as NetworkName,
            crowdfunds.map((c) => c.crowdfundAddress as `0x${string}`),
            client
          );

          const summaries = await Promise.all(
            instances.map((cf) => (cf ? cf.getContributorSummary(owner).catch(() => null) : null))
          );

          for (let i = 0; i < crowdfunds.length; i++) {
            const summary = summaries[i];
            if (!summary) continue;
            const c = crowdfunds[i];
            const isWonOrFinalized = c.status === "WON" || c.status === "FINALIZED";
            const unactivated = isWonOrFinalized && summary.contributionCardBalance > 0n;
            const hasUnclaimed = summary.contributionCardBalance > 0n && summary.ethOwed > 0n;
            if (unactivated || hasUnclaimed) {
              result.set(c.crowdfundAddress, {
                unactivated,
                ethOwed: hasUnclaimed ? summary.ethOwed : null
              });
            }
          }
        })
      );
      return result;
    },
    enabled: filterMode === "claimable" && !!address && nonActive.length > 0
  });

  const partyKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const c of contributions) {
      const network = NETWORK_ID_TO_NAME[c.networkId];
      if (network && c.partyAddress) {
        keys.add(`${network}:${c.partyAddress.toLowerCase()}`);
      }
    }
    for (const m of manualMemberships ?? []) {
      const network = NETWORK_ID_TO_NAME[m.networkId];
      if (network) {
        keys.add(`${network}:${m.partyAddress.toLowerCase()}`);
      }
    }
    return [...keys].sort();
  }, [contributions, manualMemberships]);

  const { data: rageQuitEnabledParties, isFetching: isLoadingRageQuit } = useQuery({
    queryKey: ["profile-rage-quit-enabled", partyKeys.join(",")],
    queryFn: async (): Promise<Set<string>> => {
      const enabled = new Set<string>();
      const byNetwork = new Map<NetworkName, `0x${string}`[]>();

      for (const key of partyKeys) {
        const [network, partyAddress] = key.split(":");
        const networkName = network as NetworkName;
        const list = byNetwork.get(networkName) ?? [];
        list.push(partyAddress as `0x${string}`);
        byNetwork.set(networkName, list);
      }

      await Promise.all(
        [...byNetwork.entries()].map(async ([network, addresses]) => {
          const client = getClient(network);
          await Promise.all(
            addresses.map(async (partyAddress) => {
              try {
                const party = await Party.create(network, partyAddress, client);
                const rageQuitTimestamp = await party.getRageQuitTimestamp();
                if (rageQuitTimestamp != null && rageQuitTimestamp > 0) {
                  enabled.add(`${network}:${partyAddress.toLowerCase()}`);
                }
              } catch {
                // Ignore individual party read errors.
              }
            })
          );
        })
      );

      return enabled;
    },
    enabled: filterMode === "rageQuitEnabled" && partyKeys.length > 0
  });

  const sorted = useMemo(() => {
    let list = [...contributions];
    if (filterMode === "claimable" && claimableMap) {
      list = list.filter((c) => claimableMap.has(c.crowdfundAddress));
    }
    if (filterMode === "rageQuitEnabled" && rageQuitEnabledParties) {
      list = list.filter((c) => {
        const network = NETWORK_ID_TO_NAME[c.networkId];
        if (!network || !c.partyAddress) return false;
        return rageQuitEnabledParties.has(`${network}:${c.partyAddress.toLowerCase()}`);
      });
    }
    list.sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.name.localeCompare(b.name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = a.totalAmount > b.totalAmount ? 1 : a.totalAmount < b.totalAmount ? -1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [contributions, sortField, sortDir, filterMode, claimableMap, rageQuitEnabledParties]);

  const someNeedActivation = useMemo(() => {
    if (filterMode !== "claimable" || !claimableMap) return false;
    return contributions.some((c) => {
      const info = claimableMap.get(c.crowdfundAddress);
      return !!info?.unactivated && info.ethOwed == null;
    });
  }, [filterMode, claimableMap, contributions]);

  if (isLoading || isLoadingMemberships) {
    return <Loading message="Loading profile..." />;
  }

  if (error || membershipsError) {
    return (
      <ErrorDisplay
        message="The indexer API may be down, but all other functionality should continue to work."
        backLink="/"
        backLabel="Back to Search"
      />
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "contribution" ? "desc" : "asc");
    }
  };

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const isFilterLoading =
    (filterMode === "claimable" && isLoadingClaimable) ||
    (filterMode === "rageQuitEnabled" && isLoadingRageQuit);

  return (
    <div className="md:px-6 px-3 py-6 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold party-gradient-text">Profile</h1>
      <div className="text-sm text-muted-foreground">
        <EtherscanLink network="mainnet" address={address!} addressType="address" />
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Parties & Crowdfunds</CardTitle>
          <CardDescription>
            Lost crowdfunds may have funds to reclaim. Won crowdfunds may have party cards to
            activate. Some parties may have rage quit enabled.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RadioGroup.Root
            value={filterMode}
            onValueChange={(value) => setFilterMode(value as FilterMode)}
            className="flex flex-col gap-2 text-sm"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroup.Item
                value="all"
                className="size-4 rounded-full border border-border bg-background data-[state=checked]:border-primary"
              >
                <RadioGroup.Indicator className="relative flex size-full items-center justify-center after:block after:size-2 after:rounded-full after:bg-primary" />
              </RadioGroup.Item>
              <span>Show all Parties and Crowdfunds</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer ${
                nonActive.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RadioGroup.Item
                value="claimable"
                disabled={nonActive.length === 0}
                className="size-4 rounded-full border border-border bg-background disabled:cursor-not-allowed data-[state=checked]:border-primary"
              >
                <RadioGroup.Indicator className="relative flex size-full items-center justify-center after:block after:size-2 after:rounded-full after:bg-primary" />
              </RadioGroup.Item>
              <span>Show crowdfunds with activation needed</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer ${
                partyKeys.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <RadioGroup.Item
                value="rageQuitEnabled"
                disabled={partyKeys.length === 0}
                className="size-4 rounded-full border border-border bg-background disabled:cursor-not-allowed data-[state=checked]:border-primary"
              >
                <RadioGroup.Indicator className="relative flex size-full items-center justify-center after:block after:size-2 after:rounded-full after:bg-primary" />
              </RadioGroup.Item>
              <span>Show Parties with rage quit enabled</span>
            </label>
          </RadioGroup.Root>
          {filterMode === "claimable" && someNeedActivation && (
            <p className="text-sm text-muted-foreground">
              Activate your Party card to create proposals or claim distributions
            </p>
          )}
          {filterMode === "rageQuitEnabled" && (
            <p className="text-sm text-muted-foreground">
              Rage quit lets you burn your Party membership in exchange for your share of the
              Party&apos;s token holdings
            </p>
          )}
          {isFilterLoading ? (
            <div className="flex justify-center py-4">
              <Loading
                message={
                  filterMode === "claimable"
                    ? "Checking for claimable items..."
                    : filterMode === "rageQuitEnabled"
                      ? "Checking rage quit status..."
                      : "Checking filters..."
                }
              />
            </div>
          ) : contributions.length === 0 ? (
            <p className="text-muted-foreground">No contributions found</p>
          ) : sorted.length === 0 && filterMode !== "all" ? (
            <p className="text-muted-foreground">
              {filterMode === "claimable"
                ? "No claimable items found"
                : filterMode === "rageQuitEnabled"
                  ? "No parties with rage quit enabled found"
                  : "No items match the selected filters"}
            </p>
          ) : (
            <div className="flex flex-col text-sm">
              <div className="flex items-center gap-4 border-b border-border pb-2 font-medium">
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="flex-1 min-w-0 text-left cursor-pointer hover:text-[#00d4ff] underline decoration-dotted underline-offset-4 transition-colors"
                >
                  Name{sortIndicator("name")}
                </button>
                <button
                  type="button"
                  onClick={() => handleSort("contribution")}
                  className="w-24 text-right shrink-0 cursor-pointer hover:text-[#00d4ff] underline decoration-dotted underline-offset-4 transition-colors"
                >
                  Contribution{sortIndicator("contribution")}
                </button>
                <span className="w-28 sm:w-40 text-right shrink-0">Links</span>
              </div>
              {sorted.map((c) => {
                const network = NETWORK_ID_TO_NAME[c.networkId];
                if (!network) return null;
                const claimInfo = claimableMap?.get(c.crowdfundAddress);
                return (
                  <div
                    key={c.crowdfundAddress}
                    className="flex items-center gap-2 sm:gap-6 border-b border-border last:border-b-0 py-1.5"
                  >
                    <span className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{c.name}</span>
                      {c.status && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                            c.status === "WON" || c.status === "FINALIZED"
                              ? "bg-green-900 text-green-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {c.status}
                        </span>
                      )}
                      {filterMode === "claimable" &&
                        claimInfo?.unactivated &&
                        claimInfo.ethOwed == null && (
                          <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap bg-amber-900/50 text-amber-300 ring-1 ring-amber-500/30">
                            Unactivated
                          </span>
                        )}
                      {filterMode === "claimable" && claimInfo?.ethOwed != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap bg-amber-900/50 text-amber-300 ring-1 ring-amber-500/30">
                          {Number(formatEther(claimInfo.ethOwed)).toLocaleString(undefined, {
                            maximumFractionDigits: 6
                          })}{" "}
                          ETH to claim
                        </span>
                      )}
                    </span>
                    <span className="w-24 text-right font-medium whitespace-nowrap shrink-0">
                      {Number(formatEther(c.totalAmount)).toLocaleString(undefined, {
                        maximumFractionDigits: 6
                      })}{" "}
                      ETH
                    </span>
                    <span className="w-28 sm:w-40 flex justify-end gap-1 sm:gap-2 shrink-0">
                      <Link to={`/crowdfund/${network}/${c.crowdfundAddress}`}>
                        <Button
                          variant={filterMode === "claimable" ? "default" : "outline"}
                          size="xs"
                          className="sm:h-8 sm:rounded-md sm:gap-1.5 sm:px-3 sm:text-sm"
                        >
                          <span className="sm:hidden">CF</span>
                          <span className="hidden sm:inline">Crowdfund</span>
                        </Button>
                      </Link>
                      {filterMode !== "claimable" && c.partyAddress && (
                        <Link to={`/party/${network}/${c.partyAddress}`}>
                          <Button
                            variant="outline"
                            size="xs"
                            className="sm:h-8 sm:rounded-md sm:gap-1.5 sm:px-3 sm:text-sm"
                          >
                            <span className="sm:hidden">Party</span>
                            <span className="hidden sm:inline">Party</span>
                          </Button>
                        </Link>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {manualMemberships && manualMemberships.length > 0 && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Direct Party Memberships</CardTitle>
            <CardDescription>
              Parties you belong to via direct membership (not via crowdfund contribution).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col text-sm">
              <div className="flex items-center gap-4 border-b border-border pb-2 font-medium">
                <span className="flex-1 min-w-0 text-left">Name</span>
                <span className="w-20 text-right shrink-0">Links</span>
              </div>
              {manualMemberships.map((m) => {
                const network = NETWORK_ID_TO_NAME[m.networkId];
                if (!network) return null;
                return (
                  <div
                    key={`${m.networkId}-${m.partyAddress}`}
                    className="flex items-center gap-4 border-b border-border last:border-b-0 py-1.5"
                  >
                    <span className="flex-1 min-w-0 truncate">{m.name}</span>
                    <span className="w-20 flex justify-end shrink-0">
                      <Link to={`/party/${network}/${m.partyAddress}`}>
                        <Button
                          variant="outline"
                          size="xs"
                          className="sm:h-8 sm:rounded-md sm:gap-1.5 sm:px-3 sm:text-sm"
                        >
                          Party
                        </Button>
                      </Link>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

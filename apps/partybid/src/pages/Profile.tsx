import { PartyBid } from "@party-forever/contracts";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorDisplay,
  Loading,
  Switch
} from "@party-forever/ui";
import type { PartyBidContributionSummary } from "@party-forever/externals";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { formatEther } from "viem";
import { Link, useParams } from "react-router";

import { EtherscanLink } from "@/components/EtherscanLink.tsx";
import { getClient } from "@/lib/client.ts";
import { getPartyBidApiClient } from "@/lib/party_bid_api_client.ts";

export const Profile = () => {
  const { address } = useParams<{ address: string }>();
  const [notClaimedOnly, setNotClaimedOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["partybid-profile", address],
    queryFn: async (): Promise<{
      contributions: PartyBidContributionSummary[];
      claimedStatuses: Map<`0x${string}`, boolean>;
    }> => {
      const contributions = await getPartyBidApiClient().getContributionSummaries(address!);
      const partyAddresses = contributions.map((c) => c.partyAddress as `0x${string}`);
      const client = getClient();
      const claimedStatuses = await PartyBid.getClaimedStatuses(
        partyAddresses,
        address! as `0x${string}`,
        client
      );
      return { contributions, claimedStatuses };
    },
    enabled: !!address
  });

  if (isLoading) {
    return <Loading message="Loading contributions..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message="The indexer API may be down, but all other functionality should continue to work."
        backLink="/"
        backLabel="Back to Search"
      />
    );
  }

  const contributions = data?.contributions ?? [];
  const claimedStatuses = data?.claimedStatuses ?? new Map();

  const filteredContributions = notClaimedOnly
    ? contributions.filter((c) => !claimedStatuses.get(c.partyAddress as `0x${string}`))
    : contributions;

  return (
    <div className="p-6 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold party-gradient-text">Profile</h1>
      <div className="text-sm text-muted-foreground">
        <EtherscanLink address={address!} />
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>PartyBids</CardTitle>
          <label
            className="flex items-center gap-2 shrink-0 cursor-pointer"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('[role="switch"]')) return;
              setNotClaimedOnly((v) => !v);
            }}
          >
            <span className="text-sm font-normal">Not claimed only</span>
            <Switch checked={notClaimedOnly} onCheckedChange={setNotClaimedOnly} />
          </label>
        </CardHeader>
        <CardContent>
          {filteredContributions.length === 0 ? (
            <p className="text-muted-foreground">
              {notClaimedOnly ? "No unclaimed contributions" : "No contributions found"}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredContributions.map((c) => {
                const claimed = claimedStatuses.get(c.partyAddress as `0x${string}`);
                return (
                  <div
                    key={c.partyAddress}
                    className="py-3 first:pt-0 last:pb-0 flex items-center gap-3"
                  >
                    <span className="text-sm truncate min-w-0">{c.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                        claimed ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                      }`}
                    >
                      {claimed ? "Claimed" : "Not Claimed"}
                    </span>
                    <span className="flex-1" />
                    <span className="font-medium whitespace-nowrap text-sm">
                      {Number(formatEther(c.totalAmount)).toLocaleString(undefined, {
                        maximumFractionDigits: 6
                      })}{" "}
                      ETH
                    </span>
                    <Link to={`/party/${c.partyAddress}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

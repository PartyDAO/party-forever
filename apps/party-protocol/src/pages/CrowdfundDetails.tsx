import {
  type ContributedEvent,
  Crowdfund,
  type NetworkName,
  NULL_ADDRESS
} from "@party-forever/contracts";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ErrorDisplay,
  Loading,
  useAccount
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";
import { VALID_NETWORKS } from "@/lib/constants.ts";
import { formatDate, formatEth } from "@/lib/format.ts";

enum ActivateStatus {
  Refund = "refund",
  Membership = "membership"
}

type ContributionsResult =
  | { success: true; contributions: ContributedEvent[] }
  | { success: false; error: unknown };

interface CrowdfundData {
  name: string;
  lifecycle: string;
  partyAddress: `0x${string}`;
  totalContributions: bigint;
  expiry: number;
  contributionsResult: ContributionsResult;
}

export const CrowdfundDetails = () => {
  const { network, address } = useParams<{
    network: string;
    address: string;
  }>();

  const { account: connectedAddress } = useAccount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CrowdfundData | null>(null);
  const [activateStatus, setActivateStatus] = useState<ActivateStatus | null>(null);
  const [ethOwed, setEthOwed] = useState<bigint | null>(null);
  const [userContributionsTotal, setUserContributionsTotal] = useState<bigint | null>(null);
  const [crowdfund, setCrowdfund] = useState<Crowdfund | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!network || !address) {
        setError("Missing network or address");
        setLoading(false);
        return;
      }

      if (!VALID_NETWORKS.includes(network as (typeof VALID_NETWORKS)[number])) {
        setError(`Invalid network: ${network}`);
        setLoading(false);
        return;
      }

      setCrowdfund(null);
      try {
        const client = getClient(network as NetworkName);
        const cf = await Crowdfund.create(network as NetworkName, address as `0x${string}`, client);

        const [summary, contributionsResult] = await Promise.all([
          cf.getSummary(),
          cf.getContributions().then(
            (contributions): ContributionsResult => ({ success: true, contributions }),
            (error): ContributionsResult => ({ success: false, error })
          )
        ]);

        setData({
          ...summary,
          contributionsResult
        });
        setCrowdfund(cf);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [network, address]);

  useEffect(() => {
    if (data?.name) {
      document.title = `${data.name} | Party Forever`;
    }
    return () => {
      document.title = "Party Forever";
    };
  }, [data?.name]);

  useEffect(() => {
    if (!connectedAddress || !data || !crowdfund || !network || !address) {
      setActivateStatus(null);
      setEthOwed(null);
      setUserContributionsTotal(null);
      return;
    }
    (async () => {
      try {
        const summary = await crowdfund.getContributorSummary(connectedAddress as `0x${string}`);
        setUserContributionsTotal(summary.ethContributed);
        const isWonOrFinalized = data.lifecycle === "Won" || data.lifecycle === "Finalized";
        const hasSomethingToClaim = summary.votingPower > 0n || summary.ethOwed > 0n;
        const hasNotClaimed = summary.contributionCardBalance > 0n;
        if (isWonOrFinalized && hasSomethingToClaim && hasNotClaimed) {
          const isRefund = summary.ethOwed > 0n;
          setActivateStatus(isRefund ? ActivateStatus.Refund : ActivateStatus.Membership);
          setEthOwed(isRefund ? summary.ethOwed : null);
        } else {
          setActivateStatus(null);
          setEthOwed(null);
        }
      } catch {
        setActivateStatus(null);
      }
    })();
  }, [connectedAddress, data, crowdfund, network, address]);

  const canActivate =
    !!connectedAddress &&
    activateStatus !== null &&
    (data?.lifecycle === "Won" || data?.lifecycle === "Finalized");

  if (loading) {
    return <Loading message="Loading crowdfund data..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} backLink="/search" backLabel="Back to Search" />;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="md:px-6 px-3 py-6 flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-2xl font-bold party-gradient-text">{data.name || "Unnamed"}</h1>
        <p className="text-sm text-muted-foreground">Crowdfund</p>
      </div>
      <Card className="w-full max-w-7xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{data.name}</CardTitle>
            <span className="text-sm text-muted-foreground">{network}</span>
          </div>
          <CardDescription>
            <EtherscanLink
              network={network as NetworkName}
              address={address!}
              addressType="address"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="font-medium">{data.lifecycle}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Total Contributions</dt>
              <dd className="font-medium">{formatEth(data.totalContributions)} ETH</dd>
            </div>
            {connectedAddress !== undefined && (
              <div>
                <dt className="text-sm text-muted-foreground">Your Contributions</dt>
                <dd className="font-medium">{formatEth(userContributionsTotal ?? 0n)} ETH</dd>
              </div>
            )}
            {data.expiry !== 0 && (
              <div>
                <dt className="text-sm text-muted-foreground">Expiry</dt>
                <dd className="font-medium">{formatDate(data.expiry)}</dd>
              </div>
            )}
            {data.partyAddress !== NULL_ADDRESS && (
              <div className="col-span-2">
                <dt className="text-sm text-muted-foreground">Party</dt>
                <dd className="font-medium flex flex-col gap-2">
                  <EtherscanLink
                    network={network as NetworkName}
                    address={data.partyAddress}
                    addressType="address"
                  />
                  <Link to={`/party/${network}/${data.partyAddress}`}>
                    <Button variant="outline" size="sm">
                      View party →
                    </Button>
                  </Link>
                </dd>
                {canActivate && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      You contributed but have not yet activated your party membership.
                    </p>
                    <Web3Button
                      networkName={network as NetworkName}
                      actionName={
                        activateStatus === ActivateStatus.Refund
                          ? `Reclaim ${ethOwed != null ? formatEth(ethOwed) + " " : ""}ETH`
                          : "Activate membership"
                      }
                      txnFn={async () => {
                        if (!crowdfund) throw new Error("Crowdfund not loaded");
                        return crowdfund.getActivateOrRefundTxData(
                          connectedAddress as `0x${string}`
                        );
                      }}
                      onSuccess={() => {
                        setActivateStatus(null);
                        setEthOwed(null);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card className="w-full max-w-7xl">
        <CardHeader>
          <CardTitle>
            Contributions
            {data.contributionsResult.success &&
              ` (${data.contributionsResult.contributions.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data.contributionsResult.success ? (
            <p className="text-muted-foreground">
              Could not load contribution history. This crowdfund may have too many contributions.
            </p>
          ) : data.contributionsResult.contributions.length === 0 ? (
            <p className="text-muted-foreground">No contributions yet</p>
          ) : (
            <div className="divide-y divide-border">
              {data.contributionsResult.contributions.map((contribution) => (
                <div key={contribution.transactionHash} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-center gap-4">
                    <EtherscanLink
                      network={network as NetworkName}
                      address={contribution.contributor}
                      addressType="address"
                    />
                    <div className="flex items-center gap-4">
                      <EtherscanLink
                        network={network as NetworkName}
                        address={contribution.transactionHash}
                        addressType="tx"
                      />
                      <span className="font-medium whitespace-nowrap">
                        {formatEth(contribution.amount)} ETH
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

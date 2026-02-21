import { PartyBid, PartyBidStatus, type PartyBidClaimedEvent } from "@party-forever/contracts";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { formatEther } from "viem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorDisplay,
  Loading,
  useAccount
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/EtherscanLink.tsx";
import { Web3Button } from "@/components/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

interface ContributorData {
  partyName: string;
  totalContributed: bigint;
  claimed: boolean;
  claimEvent: PartyBidClaimedEvent | null;
  partyStatus: PartyBidStatus;
}

export const ContributorDetails = () => {
  const { address, contributorAddress } = useParams<{
    address: string;
    contributorAddress: string;
  }>();
  const partyAddress = address as `0x${string}`;
  const contributor = contributorAddress as `0x${string}`;
  const { isConnected } = useAccount();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contributor", partyAddress, contributor],
    queryFn: async (): Promise<ContributorData> => {
      const client = getClient();
      const partyBid = await PartyBid.create(partyAddress, client);
      const [partyName, claimed, totalContributed, partyStatus] = await Promise.all([
        partyBid.getName(),
        partyBid.getClaimed(contributor),
        partyBid.getTotalContributed(contributor),
        partyBid.getStatus()
      ]);
      const claimEvent = claimed ? await partyBid.getClaimEvent(contributor) : null;
      return {
        partyName,
        totalContributed,
        claimed,
        claimEvent,
        partyStatus
      };
    },
    enabled: Boolean(address && contributorAddress)
  });

  if (isLoading) {
    return <Loading message="Loading contributor data..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        message={String(error)}
        backLink={`/party/${partyAddress}`}
        backLabel="Back to Party"
      />
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-6 flex flex-col items-center gap-6 max-w-2xl mx-auto">
      <div className="flex flex-col items-center gap-1">
        <Link to={`/party/${partyAddress}`} className="text-sm text-[#00d4ff] hover:underline">
          ← Back to {data.partyName}
        </Link>
        <h1 className="text-2xl font-bold party-gradient-text">Contributor</h1>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Contributor">
              <EtherscanLink address={contributor} />
            </DetailRow>
            <DetailRow label="Total Contributions">
              {formatEther(data.totalContributed)} ETH
            </DetailRow>
            <DetailRow label="Claim Status">
              <span
                className={
                  data.claimed
                    ? "text-green-400 font-medium"
                    : data.totalContributed === 0n
                      ? "text-muted-foreground font-medium"
                      : "text-yellow-400 font-medium"
                }
              >
                {data.claimed
                  ? "Claimed"
                  : data.totalContributed === 0n
                    ? "Not Eligible"
                    : "Claimable"}
              </span>
            </DetailRow>
            {data.claimEvent && (
              <DetailRow label="Claimed Tx">
                <EtherscanLink address={data.claimEvent.transactionHash} type="tx" truncate={6} />
              </DetailRow>
            )}
            {!data.claimed && data.totalContributed > 0n && (
              <div className="pt-3 border-t border-border">
                {data.partyStatus === PartyBidStatus.Active ? (
                  <p className="text-sm text-yellow-400">
                    This party needs to be{" "}
                    <Link to={`/party/${partyAddress}`} className="underline hover:opacity-80">
                      finalized
                    </Link>{" "}
                    before claims can be made.
                  </p>
                ) : !isConnected ? (
                  <p className="text-sm text-muted-foreground">Connect your wallet to claim.</p>
                ) : (
                  <Web3Button
                    actionName="Claim"
                    txnFn={async () => {
                      const client = getClient();
                      const partyBid = await PartyBid.create(partyAddress, client);
                      return partyBid.generateClaimTx(contributor);
                    }}
                    onSuccess={() => refetch()}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-right break-all">{children}</span>
  </div>
);

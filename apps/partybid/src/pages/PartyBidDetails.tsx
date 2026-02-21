import { PartyBid, PartyBidStatus, type PartyBidContributedEvent } from "@party-forever/contracts";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { formatEther } from "viem";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorDisplay,
  ExternalLinkIcon,
  Loading,
  useAccount
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/EtherscanLink.tsx";
import { NFTImage } from "@/components/NFTImage.tsx";
import { Web3Button } from "@/components/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

const STATUS_LABELS: Record<PartyBidStatus, string> = {
  [PartyBidStatus.Active]: "Needs Finalization",
  [PartyBidStatus.Won]: "Won",
  [PartyBidStatus.Lost]: "Lost"
};

const statusColor = (status: PartyBidStatus) => {
  switch (status) {
    case PartyBidStatus.Won:
      return "text-green-400";
    case PartyBidStatus.Lost:
      return "text-red-400";
    default:
      return "text-yellow-400";
  }
};

interface PartyBidData {
  name: string;
  status: PartyBidStatus;
  nftContract: `0x${string}`;
  tokenId: bigint;
  contributions: PartyBidContributedEvent[];
  totalContributed: bigint;
  accountClaimed: boolean | null;
  tokenVault: `0x${string}` | null;
}

export const PartyBidDetails = () => {
  const { address } = useParams<{ address: string }>();
  const partyAddress = address as `0x${string}`;
  const { isConnected, account } = useAccount();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["partyBid", partyAddress, account],
    queryFn: async (): Promise<PartyBidData> => {
      const client = getClient();
      const partyBid = await PartyBid.create(partyAddress, client);
      const [name, status, nftInfo, contributions] = await Promise.all([
        partyBid.getName(),
        partyBid.getStatus(),
        partyBid.getNftInfo(),
        partyBid.getContributions()
      ]);
      const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0n);
      const accountClaimed = account ? await partyBid.getClaimed(account) : null;
      const tokenVault = status === PartyBidStatus.Won ? await partyBid.getTokenVault() : null;
      return {
        name,
        status,
        nftContract: nftInfo.nftContract,
        tokenId: nftInfo.tokenId,
        contributions,
        totalContributed,
        accountClaimed,
        tokenVault
      };
    },
    enabled: Boolean(address)
  });

  useEffect(() => {
    if (data?.name) {
      document.title = data.name;
    }
  }, [data?.name]);

  if (isLoading) {
    return <Loading message="Loading PartyBid data..." />;
  }

  if (error) {
    return <ErrorDisplay message={String(error)} backLink="/" backLabel="Back to Search" />;
  }

  if (!data) {
    return null;
  }

  const openseaUrl = `https://opensea.io/item/ethereum/${data.nftContract}/${data.tokenId.toString()}`;

  return (
    <div className="p-6 flex flex-col items-center gap-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-4">
        <NFTImage nftContract={data.nftContract} tokenId={data.tokenId} />
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="text-2xl font-bold party-gradient-text">{data.name}</h1>
          <span className={`text-sm font-medium ${statusColor(data.status)}`}>
            {STATUS_LABELS[data.status]}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Party Address">
              <EtherscanLink address={partyAddress} />
            </DetailRow>
            <DetailRow label="NFT Contract">
              <EtherscanLink address={data.nftContract} />
            </DetailRow>
            <DetailRow label="Token ID">
              <span className="inline-flex items-center gap-1 font-mono">
                {data.tokenId.toString()}
                <a
                  href={openseaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer hover:opacity-70 text-[#00d4ff]"
                  title="View on OpenSea"
                >
                  <ExternalLinkIcon />
                </a>
              </span>
            </DetailRow>
            {data.tokenVault && (
              <DetailRow label="Fractional Vault Token">
                <EtherscanLink address={data.tokenVault} />
              </DetailRow>
            )}
            <DetailRow label="Total Contributed">
              {formatEther(data.totalContributed)} ETH
            </DetailRow>
            {data.status === PartyBidStatus.Active && (
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                <p className="text-sm text-yellow-400">
                  This party needs to be finalized before claims can be made.
                </p>
                {isConnected ? (
                  <Web3Button
                    actionName="Finalize"
                    txnFn={async () => {
                      const client = getClient();
                      const partyBid = await PartyBid.create(partyAddress, client);
                      return partyBid.generateExpireTx();
                    }}
                    onSuccess={() => refetch()}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Connect your wallet to finalize this party.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>My Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <ContributionList
                contributions={data.contributions.filter(
                  (c) => c.contributor.toLowerCase() === account?.toLowerCase()
                )}
                partyAddress={partyAddress}
                emptyMessage="No contributions"
                claimed={data.accountClaimed}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Contributions ({data.contributions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ContributionList
              contributions={data.contributions}
              partyAddress={partyAddress}
              emptyMessage="No contributions"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ContributionList = ({
  contributions,
  partyAddress,
  emptyMessage,
  claimed
}: {
  contributions: PartyBidContributedEvent[];
  partyAddress: `0x${string}`;
  emptyMessage: string;
  claimed?: boolean | null;
}) =>
  contributions.length === 0 ? (
    <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  ) : (
    <div className="space-y-2">
      {contributions.map((c) => (
        <div
          key={c.transactionHash}
          className="flex items-center justify-between gap-4 text-sm border-b border-border pb-2 last:border-0 last:pb-0"
        >
          <Link
            to={`/party/${partyAddress}/contributor/${c.contributor}`}
            className="hover:underline text-[#00d4ff]"
          >
            <EtherscanLink address={c.contributor} />
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            {claimed != null && (
              <span className={claimed ? "text-green-400" : "text-yellow-400"}>
                {claimed ? "Claimed" : "Claimable"}
              </span>
            )}
            <span className="text-muted-foreground">{formatEther(c.amount)} ETH</span>
            <Link
              to={`/party/${partyAddress}/contributor/${c.contributor}`}
              className="text-[#00d4ff] hover:underline"
            >
              View
            </Link>
          </div>
        </div>
      ))}
    </div>
  );

const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-sm text-muted-foreground shrink-0">{label}</span>
    <span className="text-sm text-right break-all">{children}</span>
  </div>
);

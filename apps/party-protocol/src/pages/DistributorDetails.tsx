import {
  type Distribution,
  DistributionTokenType,
  type NetworkName,
  Party,
  TokenDistributor
} from "@party-forever/contracts";
import { type ReactNode, useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { ClaimStatusLookup } from "@/components/distribution/ClaimStatusLookup.tsx";
import { Button, ErrorDisplay, Loading } from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { getClient } from "@/lib/client.ts";
import { VALID_NETWORKS } from "@/lib/constants.ts";
import { formatEth, formatTokenAmount } from "@/lib/format.ts";

interface DistributionData {
  partyName: string;
  distribution: Distribution;
  remainingMemberSupply: bigint;
}

const Row = ({ label, children }: { label: string; children: ReactNode }) => {
  return (
    <tr>
      <td className="py-1 pr-4 text-muted-foreground">{label}</td>
      <td className="py-1">{children}</td>
    </tr>
  );
};

export const DistributorDetails = () => {
  const { network, distributorAddress, partyAddress, distributionId } = useParams<{
    network: string;
    distributorAddress: string;
    partyAddress: string;
    distributionId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DistributionData | null>(null);

  useEffect(() => {
    if (data?.partyName) {
      document.title = `${data.partyName} Distribution | Party Forever`;
    }
    return () => {
      document.title = "Party Forever";
    };
  }, [data?.partyName]);

  useEffect(() => {
    async function fetchData() {
      if (!network || !distributorAddress || !partyAddress || !distributionId) {
        setError("Missing network, distributor address, party address, or distribution ID");
        setLoading(false);
        return;
      }

      if (!VALID_NETWORKS.includes(network as (typeof VALID_NETWORKS)[number])) {
        setError(`Invalid network: ${network}`);
        setLoading(false);
        return;
      }

      try {
        const client = getClient(network as NetworkName);
        const tokenDistributor = TokenDistributor.create(network as NetworkName, client);
        const party = await Party.create(
          network as NetworkName,
          partyAddress as `0x${string}`,
          client
        );

        const [partyName, distribution, remainingMemberSupply] = await Promise.all([
          party.getName().catch(() => "Unnamed Party"),
          tokenDistributor.getDistributionByIdForParty(
            distributorAddress as `0x${string}`,
            partyAddress as `0x${string}`,
            BigInt(distributionId)
          ),
          tokenDistributor.getRemainingMemberSupply(
            distributorAddress as `0x${string}`,
            partyAddress as `0x${string}`,
            BigInt(distributionId)
          )
        ]);

        if (!distribution) {
          setError("Distribution not found");
          setLoading(false);
          return;
        }

        setData({
          partyName,
          distribution,
          remainingMemberSupply
        });
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [network, distributorAddress, partyAddress, distributionId]);

  if (loading) {
    return <Loading message="Loading distribution..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} backLink="/" backLabel="Back to Search" />;
  }

  if (!data) {
    return null;
  }

  const networkName = network as NetworkName;
  const { distribution, remainingMemberSupply } = data;

  const claimedAmount = distribution.memberSupply - remainingMemberSupply;
  const claimedPercent =
    distribution.memberSupply > 0n ? Number((claimedAmount * 100n) / distribution.memberSupply) : 0;

  return (
    <div className="md:px-6 px-3 py-6 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex justify-between items-start">
          <table className="text-sm">
            <tbody>
              <Row label="Network">{network}</Row>
              <Row label="Distributor">
                <EtherscanLink
                  network={networkName}
                  address={distributorAddress!}
                  addressType="address"
                />
              </Row>
              <Row label="Distribution ID">{distributionId}</Row>
              <Row label="Party">{data.partyName}</Row>
              <Row label="Party Address">
                <EtherscanLink
                  network={networkName}
                  address={partyAddress!}
                  addressType="address"
                />
              </Row>
              <Row label="Block">{distribution.blockNumber.toString()}</Row>
              <Row label="Token Type">
                {distribution.tokenType === DistributionTokenType.Native ? "Native (ETH)" : "ERC20"}
              </Row>
              {distribution.tokenType === DistributionTokenType.ERC20 && (
                <>
                  <Row label="Token">
                    {distribution.tokenName} ({distribution.tokenSymbol})
                  </Row>
                  <Row label="Token Address">
                    <EtherscanLink
                      network={networkName}
                      address={distribution.tokenAddress}
                      addressType="address"
                    />
                  </Row>
                </>
              )}
              <Row label="Transaction">
                <EtherscanLink
                  network={networkName}
                  address={distribution.transactionHash}
                  addressType="tx"
                />
              </Row>
              <Row label="Amount">
                {distribution.tokenType === DistributionTokenType.Native
                  ? `${formatEth(distribution.memberSupply + distribution.fee)} ETH`
                  : `${formatTokenAmount(distribution.memberSupply + distribution.fee, distribution.tokenDecimals)} ${distribution.tokenSymbol}`}
              </Row>
              <Row label="Claimed">{claimedPercent.toFixed(2)}%</Row>
            </tbody>
          </table>

          <Link to={`/party/${network}/${partyAddress}#distributions`}>
            <Button variant="outline">View Party</Button>
          </Link>
        </div>

        <ClaimStatusLookup
          networkName={networkName}
          distributorAddress={distributorAddress as `0x${string}`}
          partyAddress={partyAddress as `0x${string}`}
          distributionId={BigInt(distributionId!)}
        />
      </div>
    </div>
  );
};

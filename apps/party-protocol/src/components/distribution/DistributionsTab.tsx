import {
  type Distribution,
  DistributionTokenType,
  type NetworkName
} from "@party-forever/contracts";
import { Link } from "react-router";

import { Button } from "@party-forever/ui";
import { formatEth, formatTokenAmount } from "@/lib/format.ts";

interface DistributionRowProps {
  distribution: Distribution;
  network: NetworkName;
  partyAddress: `0x${string}`;
}

const DistributionRow = ({ distribution, network, partyAddress }: DistributionRowProps) => {
  const isNative = distribution.tokenType === DistributionTokenType.Native;
  const totalAmount = distribution.memberSupply + distribution.fee;

  return (
    <tr key={distribution.transactionHash} className="border-b">
      <td className="py-2">
        {isNative ? "ETH" : `${distribution.tokenName} (${distribution.tokenSymbol})`}
      </td>
      <td className="py-2">
        {isNative
          ? `${formatEth(totalAmount)} ETH`
          : `${formatTokenAmount(totalAmount, distribution.tokenDecimals)} ${distribution.tokenSymbol}`}
      </td>
      <td className="py-2">{distribution.blockNumber.toString()}</td>
      <td className="py-2 text-right">
        <Link
          to={`/distributor/${network}/${distribution.distributorAddress}/${partyAddress}/${distribution.distributionId.toString()}`}
        >
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
      </td>
    </tr>
  );
};

interface DistributionsTabProps {
  distributions: Distribution[];
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember?: boolean;
  distributionButtonLabel?: string;
  onOpenDistributionDialog?: () => void;
}

export const DistributionsTab = ({
  distributions,
  network,
  partyAddress,
  isMember,
  distributionButtonLabel = "New Distribution",
  onOpenDistributionDialog
}: DistributionsTabProps) => {
  const showButton = isMember && onOpenDistributionDialog;

  return (
    <div className="flex flex-col gap-4">
      {showButton && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => onOpenDistributionDialog!()}>
            {distributionButtonLabel}
          </Button>
        </div>
      )}
      {distributions.length === 0 ? (
        <p className="text-muted-foreground">No distributions yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Asset</th>
              <th className="text-left py-2 font-medium">Amount</th>
              <th className="text-left py-2 font-medium">Block Number</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {[...distributions]
              .sort((a, b) => Number(b.blockNumber - a.blockNumber))
              .map((distribution) => (
                <DistributionRow
                  key={distribution.transactionHash}
                  distribution={distribution}
                  network={network}
                  partyAddress={partyAddress}
                />
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

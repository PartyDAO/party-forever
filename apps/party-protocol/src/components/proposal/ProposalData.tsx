import type { NetworkName, ProposalData as ProposalDataType } from "@party-forever/contracts";
import { ProposalType } from "@party-forever/contracts";

import { ArbitraryCallsDisplay } from "./ArbitraryCallsDisplay.tsx";
import { DistributionProposalDisplay } from "./DistributionProposalDisplay.tsx";
import { OpenseaListingDisplay } from "./OpenseaListingDisplay.tsx";
import { SeaportOrderDisplay } from "./SeaportOrderDisplay.tsx";
import { UpgradeProposalEngineDisplay } from "./UpgradeProposalEngineDisplay.tsx";

interface ProposalDataProps {
  data: ProposalDataType;
  network: NetworkName;
}

export const ProposalData = ({ data, network }: ProposalDataProps) => {
  const { proposalType, ...rest } = data;

  if (proposalType === ProposalType.ArbitraryCalls && "calls" in data) {
    return <ArbitraryCallsDisplay calls={data.calls} network={network} />;
  }

  if (proposalType === ProposalType.UpgradeProposalEngineImpl) {
    return <UpgradeProposalEngineDisplay />;
  }

  if (
    proposalType === ProposalType.ListOnOpensea ||
    proposalType === ProposalType.ListOnOpenseaAdvanced
  ) {
    if ("seaportOrderData" in data && data.seaportOrderData) {
      return <SeaportOrderDisplay order={data.seaportOrderData} network={network} />;
    }
    if ("token" in data && "tokenId" in data) {
      return <OpenseaListingDisplay data={data} network={network} />;
    }
  }

  if (proposalType === ProposalType.Invalid) {
    return (
      <p className="text-muted-foreground text-sm">
        Unknown proposal type (not supported by this UI)
      </p>
    );
  }

  if (proposalType === ProposalType.Distribute) {
    const { amount, tokenType, token } = rest as {
      amount: bigint;
      tokenType: number;
      token: string;
    };
    return (
      <DistributionProposalDisplay
        amount={amount}
        tokenType={tokenType}
        token={token}
        network={network}
      />
    );
  }

  return (
    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
      {JSON.stringify(rest, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2)}
    </pre>
  );
};

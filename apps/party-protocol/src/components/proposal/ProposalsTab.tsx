import type {
  NetworkName,
  Party,
  PartyCreationData,
  ProposedEvent
} from "@party-forever/contracts";
import { Globals } from "@party-forever/contracts";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { ArbitraryBytecodeProposalDialog } from "@/components/proposal/ArbitraryBytecodeProposalDialog.tsx";
import { Proposal } from "@/components/proposal/Proposal.tsx";
import { UpgradeProposalEngineDialog } from "@/components/proposal/UpgradeProposalEngineDialog.tsx";
import { WalletConnectProposalDialog } from "@/components/proposal/WalletConnectProposalDialog.tsx";
import { Button } from "@party-forever/ui";
import { getClient } from "@/lib/client";

interface ProposalsTabProps {
  proposals: ProposedEvent[];
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember: boolean;
  isHost: boolean;
  connectedAddress?: `0x${string}`;
  distributionType?: "proposal" | "direct";
  isNftParty?: boolean;
  partyCreationData?: PartyCreationData;
  onOpenSendNftDialog?: (nftContractAddress?: string, nftTokenId?: string) => void;
  onOpenSendTokenDialog?: (tokenAddress?: string, decimals?: number) => void;
  onOpenDistributionDialog?: () => void;
  onOpenOpenseaSaleDialog?: () => void;
  party: Party;
}

export const ProposalsTab = ({
  proposals,
  network,
  partyAddress,
  isMember,
  isHost,
  connectedAddress,
  distributionType = "proposal",
  isNftParty = false,
  partyCreationData,
  onOpenSendNftDialog,
  onOpenSendTokenDialog,
  onOpenDistributionDialog,
  onOpenOpenseaSaleDialog,
  party
}: ProposalsTabProps) => {
  const [upgradeEngineDialogOpen, setUpgradeEngineDialogOpen] = useState(false);
  const [hideDefeatedOrExpired, setHideDefeatedOrExpired] = useState(true);
  const hasProposalInProgress = proposals.some((p) => p.stateInfo.status === "In Progress");
  const blockExecute = distributionType === "direct" && hasProposalInProgress;

  const isDefeatedOrExpired = (p: ProposedEvent) =>
    p.stateInfo.status !== "Complete" &&
    (p.stateInfo.status === "Defeated" || p.proposal.maxExecutableTime * 1000 < Date.now());

  const visibleProposals = hideDefeatedOrExpired
    ? proposals.filter((p) => !isDefeatedOrExpired(p))
    : proposals;

  const { data: acceptedEvents } = useQuery({
    queryKey: ["proposalAccepted", partyAddress, network],
    queryFn: async () => party.fetchProposalAcceptedEvents(),
    enabled: Boolean(partyAddress),
    staleTime: Number.POSITIVE_INFINITY
  });

  const { data: upgradeEngineNeeded } = useQuery({
    queryKey: ["proposalEngineUpgradeNeeded", partyAddress, network],
    queryFn: async () => {
      const globals = new Globals(network, getClient(network));
      const [current, latest] = await Promise.all([
        party.getProposalExecutionEngine(),
        globals.getLatestProposalEngineImpl()
      ]);
      return current.toLowerCase() !== latest.toLowerCase();
    },
    enabled: Boolean(partyAddress && network)
  });

  const hasVoted = (proposalId: bigint) =>
    Boolean(
      connectedAddress &&
      acceptedEvents?.some(
        (e) =>
          e.proposalId === proposalId && e.voter.toLowerCase() === connectedAddress.toLowerCase()
      )
    );
  return (
    <div className="flex flex-col gap-4 min-w-0">
      {isMember && (
        <div className="flex flex-wrap mx-auto gap-2 min-w-0 [&_button]:w-full [&_button]:sm:w-auto [&_button]:min-w-0">
          <ArbitraryBytecodeProposalDialog network={network} partyAddress={partyAddress} />
          <WalletConnectProposalDialog network={network} partyAddress={partyAddress} />
          {upgradeEngineNeeded === true && (
            <>
              <Button
                type="button"
                variant="alert"
                onClick={() => setUpgradeEngineDialogOpen(true)}
              >
                Upgrade proposal engine
              </Button>
              <UpgradeProposalEngineDialog
                open={upgradeEngineDialogOpen}
                onOpenChange={setUpgradeEngineDialogOpen}
                network={network}
                partyAddress={partyAddress}
                isMember={isMember}
              />
            </>
          )}
          {onOpenDistributionDialog && (
            <Button type="button" onClick={() => onOpenDistributionDialog()}>
              {distributionType === "direct" ? "New Distribution" : "New Distribution Proposal"}
            </Button>
          )}
          {onOpenOpenseaSaleDialog && isNftParty && (
            <Button type="button" onClick={() => onOpenOpenseaSaleDialog()}>
              Sell NFT on OpenSea
            </Button>
          )}
          {onOpenSendNftDialog && (
            <Button type="button" onClick={() => onOpenSendNftDialog()}>
              Send NFT
            </Button>
          )}
          {onOpenSendTokenDialog && (
            <Button type="button" onClick={() => onOpenSendTokenDialog()}>
              Send Token
            </Button>
          )}
        </div>
      )}
      {proposals.length === 0 ? (
        <p className="text-muted-foreground">No proposals yet</p>
      ) : (
        <>
          <div className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-6 md:px-4 md:max-w-2xl">
            <label className="-mb-2 flex items-center gap-2 cursor-pointer w-fit text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={hideDefeatedOrExpired}
                onChange={(e) => setHideDefeatedOrExpired(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span>Hide defeated or expired</span>
            </label>
            {[...visibleProposals]
              .sort((a, b) => Number(b.proposalId - a.proposalId))
              .map((proposal) => (
                <Proposal
                  key={proposal.transactionHash}
                  proposal={proposal}
                  network={network}
                  partyAddress={partyAddress}
                  connectedAddress={connectedAddress ?? undefined}
                  isMember={isMember}
                  isHost={isHost}
                  hasVoted={hasVoted(proposal.proposalId)}
                  blockExecute={blockExecute}
                  partyCreationData={partyCreationData}
                  votes={acceptedEvents
                    ?.filter((e) => e.proposalId === proposal.proposalId)
                    .map((e) => ({ voter: e.voter, weight: e.weight }))}
                  party={party}
                />
              ))}
          </div>
          {visibleProposals.length === 0 && proposals.length > 0 && (
            <p className="text-muted-foreground text-sm">
              No proposals to show. Uncheck “Hide defeated or expired” to see all.
            </p>
          )}
        </>
      )}
    </div>
  );
};

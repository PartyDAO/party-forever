import type {
  NetworkName,
  Party,
  PartyCreationData,
  ProposedEvent
} from "@party-forever/contracts";

import { Button } from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";

interface ProposalActionButtonsProps {
  proposal: ProposedEvent;
  network: NetworkName;
  connectedAddress: `0x${string}` | undefined;
  partyCreationData: PartyCreationData | undefined;
  showVoteSection: boolean;
  hasVoted: boolean;
  showVetoSection: boolean;
  showExecuteSection: boolean;
  blockExecute: boolean;
  executeButtonLabel: string;
  showExecuteStep2Section: boolean;
  showFinalizeSection: boolean;
  party: Party;
}

export const ProposalActionButtons = ({
  proposal,
  network,
  connectedAddress,
  partyCreationData,
  showVoteSection,
  hasVoted,
  showVetoSection,
  showExecuteSection,
  blockExecute,
  executeButtonLabel,
  showExecuteStep2Section,
  showFinalizeSection,
  party
}: ProposalActionButtonsProps) => {
  const seaportOrder =
    "seaportOrderData" in proposal.proposal.proposalData
      ? (proposal.proposal.proposalData.seaportOrderData ?? null)
      : null;

  return (
    <>
      {showVoteSection &&
        (hasVoted ? (
          <Button disabled className="w-full">
            Already Accepted
          </Button>
        ) : (
          <div className="w-full">
            <Web3Button
              className="w-full"
              networkName={network}
              actionName="Accept Proposal"
              variant="default"
              txnFn={() =>
                party.getAcceptProposalTxData(
                  proposal.proposalId,
                  connectedAddress!,
                  proposal.stateInfo.values.proposedTime
                )
              }
            />
          </div>
        ))}

      {showVetoSection && (
        <div className="w-full">
          <Web3Button
            className="w-full"
            networkName={network}
            actionName="Veto Proposal"
            variant="destructive"
            txnFn={async () => party.getVetoProposalTxData(proposal.proposalId)}
          />
        </div>
      )}

      {showExecuteSection &&
        (blockExecute ? (
          <Button disabled className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Wait for other proposals to complete
          </Button>
        ) : (
          <div className="w-full">
            <Web3Button
              className="w-full"
              networkName={network}
              actionName={executeButtonLabel}
              variant="default"
              txnFn={async () => {
                if (!partyCreationData) {
                  alert("Party creation data has not loaded yet. Please wait and try again.");
                  throw new Error("Party creation data not loaded");
                }
                return party.getExecuteProposalTxData(
                  proposal.proposalId,
                  {
                    maxExecutableTime: proposal.proposal.maxExecutableTime,
                    cancelDelay: proposal.proposal.cancelDelay,
                    proposalData: proposal.proposal.rawProposalData
                  },
                  {
                    preciousTokens: partyCreationData.preciousTokens,
                    preciousTokenIds: partyCreationData.preciousTokenIds
                  }
                );
              }}
            />
          </div>
        ))}

      {showExecuteStep2Section && (
        <div className="w-full">
          <Web3Button
            className="w-full"
            networkName={network}
            actionName="List on OpenSea"
            variant="default"
            txnFn={async () => {
              if (!partyCreationData) {
                alert("Party creation data has not loaded yet. Please wait and try again.");
                throw new Error("Party creation data not loaded");
              }
              return party.generateOpenseaFinalizationTxData(
                proposal.proposalId,
                partyCreationData.preciousTokens,
                partyCreationData.preciousTokenIds
              );
            }}
          />
        </div>
      )}

      {showFinalizeSection && seaportOrder && (
        <div className="w-full">
          <Web3Button
            className="w-full"
            networkName={network}
            actionName="Finalize"
            variant="default"
            txnFn={async () => {
              if (!partyCreationData) {
                alert("Party creation data has not loaded yet. Please wait and try again.");
                throw new Error("Party creation data not loaded");
              }
              return party.generateOpenseaFinalizationTxData(
                proposal.proposalId,
                partyCreationData.preciousTokens,
                partyCreationData.preciousTokenIds
              );
            }}
          />
        </div>
      )}
    </>
  );
};

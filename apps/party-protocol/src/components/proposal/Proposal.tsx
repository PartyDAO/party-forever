import {
  type NetworkName,
  type Party,
  type PartyCreationData,
  type ProposalStatus,
  ProposalType,
  type ProposedEvent
} from "@party-forever/contracts";
import { cn } from "@party-forever/ui";
import { AlertCircle, AlertTriangle, ExternalLink, Vote } from "lucide-react";

import { OpenseaProposalStepper } from "@/components/proposal/OpenseaProposalStepper.tsx";
import { ProposalActionButtons } from "@/components/proposal/ProposalActionButtons.tsx";
import { ProposalData } from "@/components/proposal/ProposalData.tsx";
import { ProposalTypeIcon } from "@/components/proposal/ProposalTypeIcon.tsx";
import {
  ProposalVotersDialog,
  type ProposalVote
} from "@/components/proposal/ProposalVotersDialog.tsx";
import { Countdown } from "@/components/ui/Countdown.tsx";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import {
  formatDuration,
  formatEth,
  formatProposalDate,
  formatDateWithTimezone
} from "@/lib/format.ts";
import { getOpenseaAssetUrl } from "@/lib/opensea.ts";
import { getProposalTypeLabel } from "@/lib/proposalLabels.ts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ProposalStatus, string> = {
  Invalid: "Invalid",
  Voting: "Voting",
  Defeated: "Defeated",
  Passed: "Passed",
  Ready: "Ready to Execute",
  "In Progress": "In Progress",
  Complete: "Complete",
  Cancelled: "Cancelled"
};

const CARD_BG_CLASS = {
  executed: "bg-card",
  failed: "bg-slate-300 dark:bg-slate-500",
  voting: "bg-[#0057ff]",
  default: "bg-purple-600"
} as const;

type CardVariant = keyof typeof CARD_BG_CLASS;

// ---------------------------------------------------------------------------
// Derived-state helper
// ---------------------------------------------------------------------------

interface DerivedProposalState {
  status: ProposalStatus;
  proposalData: ProposedEvent["proposal"]["proposalData"];
  isOpenseaProposal: boolean;
  isProposalExpired: boolean;
  isExpiredReady: boolean;
  isUnsoldComplete: boolean;
  cardVariant: CardVariant;
  headerTextClass: string;
  statusLabel: string;
  showVoteSection: boolean;
  showVetoSection: boolean;
  showExecuteSection: boolean;
  showMaxExecutableTime: boolean;
  showVetoPeriodCountdown: boolean;
  showExecuteStep2Section: boolean;
  showFinalizeSection: boolean;
  skipSafetyAuction: boolean;
  votePercent: number;
  votePercentLabel: string;
  votingStatusText: string;
  displayDate: number;
  executeButtonLabel: string;
  openSeaAlertMessage: string | null;
}

function deriveProposalState(
  proposal: ProposedEvent,
  opts: {
    isMember: boolean;
    isHost: boolean;
    connectedAddress: `0x${string}` | undefined;
    partyAddress: `0x${string}` | undefined;
    partyCreationData: PartyCreationData | undefined;
  }
): DerivedProposalState {
  const { isMember, isHost, connectedAddress, partyAddress, partyCreationData } = opts;
  const canAct = isMember && Boolean(connectedAddress && partyAddress);

  const status = proposal.stateInfo.status;
  const proposalData = proposal.proposal.proposalData;
  const isProposalExpired = proposal.proposal.maxExecutableTime * 1000 < Date.now();
  const isExpiredReady = status === "Ready" && isProposalExpired;

  // OpenSea-specific
  const isOpenseaProposal =
    proposalData.proposalType === ProposalType.ListOnOpensea ||
    proposalData.proposalType === ProposalType.ListOnOpenseaAdvanced;

  const seaportOrder =
    "seaportOrderData" in proposalData ? (proposalData.seaportOrderData ?? null) : null;
  const isOrderExpired = seaportOrder != null && Number(seaportOrder.expiry) * 1000 < Date.now();
  const isUnsoldComplete =
    isOpenseaProposal &&
    status === "Complete" &&
    seaportOrder != null &&
    seaportOrder.orderStatus.totalFilled === 0n;

  // Card styling
  const cardVariant: CardVariant =
    status === "Complete" && !isUnsoldComplete
      ? "executed"
      : status === "Defeated" ||
          status === "Cancelled" ||
          status === "Invalid" ||
          isExpiredReady ||
          isUnsoldComplete
        ? "failed"
        : status === "Voting"
          ? "voting"
          : "default";

  const headerTextClass =
    cardVariant === "executed"
      ? "text-card-foreground"
      : cardVariant === "failed"
        ? "text-slate-800 dark:text-slate-100"
        : "text-white";

  const statusLabel = isUnsoldComplete
    ? "Listing expired"
    : isExpiredReady
      ? "Expired"
      : STATUS_LABELS[status];

  // Action visibility
  const isVotable = status === "Voting" || status === "Ready" || status === "Passed";
  const showVoteSection = isVotable && canAct;
  const showVetoSection = isVotable && canAct && isHost;
  const showExecuteSection = status === "Ready" && !isProposalExpired && canAct;
  const showMaxExecutableTime = !["Defeated", "Complete", "In Progress"].includes(status);
  const showVetoPeriodCountdown = proposal.executableAt !== undefined;

  // Precious / safety-auction logic
  const isUnanimous =
    proposal.stateInfo.values.votes === proposal.stateInfo.values.totalVotingPower;

  const isPrecious =
    isOpenseaProposal &&
    "token" in proposalData &&
    "tokenId" in proposalData &&
    partyCreationData != null &&
    partyCreationData.preciousTokens.some(
      (t, i) =>
        t.toLowerCase() === (proposalData as { token: string }).token.toLowerCase() &&
        partyCreationData.preciousTokenIds[i] === (proposalData as { tokenId: bigint }).tokenId
    );

  const skipSafetyAuction = isUnanimous || !isPrecious;

  const showExecuteStep2Section =
    isOpenseaProposal &&
    !skipSafetyAuction &&
    seaportOrder === null &&
    status === "In Progress" &&
    canAct;

  const isItemSold = seaportOrder != null && seaportOrder.orderStatus.totalFilled > 0n;

  const showFinalizeSection =
    isOpenseaProposal &&
    status === "In Progress" &&
    seaportOrder != null &&
    (isItemSold || isOrderExpired || isProposalExpired) &&
    canAct;

  // Vote display
  const votePercent =
    proposal.stateInfo.values.totalVotingPower > 0n
      ? Number(
          (proposal.stateInfo.values.votes * 10000n) / proposal.stateInfo.values.totalVotingPower
        ) / 100
      : 0;

  const votePercentLabel = `${votePercent.toFixed(0)}% accepted`;

  const passedTime = proposal.stateInfo.values.passedTime;
  const displayDate = passedTime !== 0 ? passedTime : proposal.stateInfo.values.proposedTime;

  const votingStatusText =
    status === "Passed" || status === "Ready"
      ? "Proposal passed"
      : status === "Defeated"
        ? `${votePercent.toFixed(0)}% accepted — did not pass`
        : status === "Voting"
          ? "Voting in progress"
          : status === "Complete"
            ? "Completed"
            : status;

  // OpenSea alert
  const openSeaAlertMessage =
    isOpenseaProposal &&
    "token" in proposalData &&
    "duration" in proposalData &&
    (proposalData.proposalType === ProposalType.ListOnOpensea
      ? "listPrice" in proposalData
      : "startPrice" in proposalData)
      ? (() => {
          const price =
            proposalData.proposalType === ProposalType.ListOnOpensea
              ? proposalData.listPrice
              : proposalData.startPrice;
          return `This item will be listed on OpenSea with a price of ${formatEth(price)} ETH for ${formatDuration(proposalData.duration)}.`;
        })()
      : null;

  const executeButtonLabel = isOpenseaProposal
    ? skipSafetyAuction
      ? "List on OpenSea"
      : "Execute Step 1 of 2"
    : "Execute";

  return {
    status,
    proposalData,
    isOpenseaProposal,
    isProposalExpired,
    isExpiredReady,
    isUnsoldComplete,
    cardVariant,
    headerTextClass,
    statusLabel,
    showVoteSection,
    showVetoSection,
    showExecuteSection,
    showMaxExecutableTime,
    showVetoPeriodCountdown,
    showExecuteStep2Section,
    showFinalizeSection,
    skipSafetyAuction,
    votePercent,
    votePercentLabel,
    votingStatusText,
    displayDate,
    executeButtonLabel,
    openSeaAlertMessage
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ProposalHeader = ({
  proposalId,
  cardVariant,
  headerTextClass,
  statusLabel
}: {
  proposalId: bigint;
  cardVariant: CardVariant;
  headerTextClass: string;
  statusLabel: string;
}) => (
  <div className="px-5 py-3 flex items-center justify-between">
    <span
      className={cn(
        "font-bold",
        cardVariant === "default" || cardVariant === "voting" ? "text-white" : headerTextClass
      )}
    >
      Proposal #{proposalId.toString()}
    </span>
    <span className={headerTextClass}>{statusLabel}</span>
  </div>
);

const ExecutableTime = ({ timestamp, isExpired }: { timestamp: number; isExpired: boolean }) => (
  <span>
    {formatDateWithTimezone(timestamp)}
    {isExpired && (
      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </span>
    )}
  </span>
);

const OpenseaLink = ({
  network,
  proposalData
}: {
  network: NetworkName;
  proposalData: ProposedEvent["proposal"]["proposalData"];
}) => {
  if (!("token" in proposalData && "tokenId" in proposalData)) return null;
  return (
    <a
      href={getOpenseaAssetUrl(network, proposalData.token, proposalData.tokenId.toString())}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm hover:text-[#00d4ff] inline-flex items-center gap-1.5 w-fit transition-colors"
    >
      View on OpenSea <ExternalLink className="size-3.5" />
    </a>
  );
};

const VotingSummary = ({
  votePercentLabel,
  votingStatusText,
  displayDate,
  proposalId,
  proposer,
  votes,
  totalVotingPower,
  hosts,
  network
}: {
  votePercentLabel: string;
  votingStatusText: string;
  displayDate: number;
  proposalId: bigint;
  proposer: `0x${string}`;
  votes: ProposalVote[];
  totalVotingPower: bigint;
  hosts: `0x${string}`[];
  network: NetworkName;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-3 text-sm">
      <ProposalVotersDialog
        proposalId={proposalId}
        proposer={proposer}
        votes={votes}
        totalVotingPower={totalVotingPower}
        hosts={hosts}
        network={network}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 cursor-pointer hover:text-[#00d4ff] transition-colors underline underline-offset-2 decoration-dotted"
        >
          <Vote className="size-4" />
          {votePercentLabel} ({votes.length} vote{votes.length !== 1 ? "s" : ""})
        </button>
      </ProposalVotersDialog>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span>{votingStatusText}</span>
      <span className="tabular-nums">{formatProposalDate(displayDate)}</span>
    </div>
  </div>
);

const OpenseaAlert = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-purple-300 bg-purple-500/10 dark:border-purple-500/40 dark:bg-purple-500/10 p-4 flex gap-3">
    <AlertCircle className="size-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
    <p className="text-sm text-foreground">{message}</p>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ProposalProps {
  proposal: ProposedEvent;
  network: NetworkName;
  partyAddress?: `0x${string}`;
  connectedAddress?: `0x${string}`;
  isMember?: boolean;
  isHost?: boolean;
  hasVoted?: boolean;
  blockExecute?: boolean;
  partyCreationData?: PartyCreationData;
  votes?: ProposalVote[];
  party: Party;
}

export const Proposal = ({
  proposal,
  network,
  partyAddress,
  connectedAddress,
  isMember,
  isHost = false,
  hasVoted = false,
  blockExecute = false,
  partyCreationData,
  votes = [],
  party
}: ProposalProps) => {
  const s = deriveProposalState(proposal, {
    isMember: !!isMember,
    isHost,
    connectedAddress,
    partyAddress,
    partyCreationData
  });

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full rounded-2xl overflow-hidden",
        CARD_BG_CLASS[s.cardVariant],
        s.cardVariant === "executed" && "border border-border"
      )}
    >
      <ProposalHeader
        proposalId={proposal.proposalId}
        cardVariant={s.cardVariant}
        headerTextClass={s.headerTextClass}
        statusLabel={s.statusLabel}
      />

      <div className="rounded-2xl bg-card text-card-foreground mx-2 mb-2 p-5 flex flex-col gap-5">
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ProposalTypeIcon
              proposalType={s.proposalData.proposalType}
              proposalData={s.proposalData}
              className="size-5 shrink-0"
            />
            {getProposalTypeLabel(s.proposalData.proposalType, s.proposalData)}
          </h3>
          <p className="text-sm">
            Created by{" "}
            <EtherscanLink network={network} address={proposal.proposer} addressType="address" /> (
            <EtherscanLink
              network={network}
              address={proposal.transactionHash}
              addressType="tx"
              text="tx"
            />
            )
          </p>
        </div>

        <ProposalData data={proposal.proposal.proposalData} network={network} />

        {s.isOpenseaProposal && <OpenseaLink network={network} proposalData={s.proposalData} />}

        <VotingSummary
          votePercentLabel={s.votePercentLabel}
          votingStatusText={s.votingStatusText}
          displayDate={s.displayDate}
          proposalId={proposal.proposalId}
          proposer={proposal.proposer}
          votes={votes}
          totalVotingPower={proposal.stateInfo.values.totalVotingPower}
          hosts={partyCreationData?.hosts ?? []}
          network={network}
        />

        {s.showMaxExecutableTime && (
          <div className="text-sm">
            <span>Max executable time: </span>
            <ExecutableTime
              timestamp={proposal.proposal.maxExecutableTime}
              isExpired={s.isProposalExpired}
            />
          </div>
        )}

        {s.showVetoPeriodCountdown && (
          <div className="text-sm">
            <span>Executable in: </span>
            <Countdown targetTimestamp={proposal.executableAt!} className="font-medium" />
            <span className="text-xs block mt-0.5">Get 100% votes to execute immediately</span>
          </div>
        )}

        {s.showExecuteSection && s.openSeaAlertMessage && (
          <OpenseaAlert message={s.openSeaAlertMessage} />
        )}

        <div className="flex flex-col gap-2 w-full">
          <ProposalActionButtons
            proposal={proposal}
            network={network}
            connectedAddress={connectedAddress}
            partyCreationData={partyCreationData}
            showVoteSection={s.showVoteSection}
            hasVoted={hasVoted}
            showVetoSection={s.showVetoSection}
            showExecuteSection={s.showExecuteSection}
            blockExecute={blockExecute}
            executeButtonLabel={s.executeButtonLabel}
            showExecuteStep2Section={s.showExecuteStep2Section}
            showFinalizeSection={s.showFinalizeSection}
            party={party}
          />
        </div>
      </div>

      {s.isOpenseaProposal && (s.status === "Ready" || s.status === "In Progress") && (
        <OpenseaProposalStepper
          status={s.status}
          skipSafetyAuction={s.skipSafetyAuction}
          showExecuteStep2Section={s.showExecuteStep2Section}
          showFinalizeSection={s.showFinalizeSection}
        />
      )}
    </div>
  );
};

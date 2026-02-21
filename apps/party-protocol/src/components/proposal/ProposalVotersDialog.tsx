import type { NetworkName } from "@party-forever/contracts";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";

export interface ProposalVote {
  voter: `0x${string}`;
  weight?: bigint;
}

interface ProposalVotersDialogProps {
  proposalId: bigint;
  proposer: `0x${string}`;
  votes: ProposalVote[];
  totalVotingPower: bigint;
  hosts: `0x${string}`[];
  network: NetworkName;
  children: React.ReactNode;
}

export const ProposalVotersDialog = ({
  proposalId,
  proposer,
  votes,
  totalVotingPower,
  hosts,
  network,
  children
}: ProposalVotersDialogProps) => {
  const hostsLower = new Set(hosts.map((h) => h.toLowerCase()));
  const proposerLower = proposer.toLowerCase();

  const votePercent = (weight: bigint) =>
    totalVotingPower > 0n
      ? `${(Number((weight * 10000n) / totalVotingPower) / 100).toFixed(0)}% of votes`
      : "";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[700px]">
        <DialogTitle>Voters — Proposal #{proposalId.toString()}</DialogTitle>
        <DialogDescription>
          {votes.length} vote{votes.length !== 1 ? "s" : ""}
        </DialogDescription>
        <div className="flex flex-col gap-3 mt-2 max-h-80 overflow-y-auto">
          {votes.length === 0 && <p className="text-sm text-muted-foreground">No votes yet</p>}
          {votes.map((vote) => {
            const isHost = hostsLower.has(vote.voter.toLowerCase());
            const isProposer = vote.voter.toLowerCase() === proposerLower;
            return (
              <div key={vote.voter} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <EtherscanLink network={network} address={vote.voter} addressType="address" />
                  {isHost && (
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      Host
                    </span>
                  )}
                  {isProposer && (
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                      Proposer
                    </span>
                  )}
                </div>
                {vote.weight != null && (
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {votePercent(vote.weight)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

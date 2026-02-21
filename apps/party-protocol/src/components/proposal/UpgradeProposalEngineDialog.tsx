import { Globals, type NetworkName, Party } from "@party-forever/contracts";
import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  useAccount
} from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

const MAX_EXECUTABLE_TIME_DAYS = 90;
const CANCEL_DELAY_SECONDS = 3628800;

interface UpgradeProposalEngineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember: boolean;
}

export const UpgradeProposalEngineDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  isMember
}: UpgradeProposalEngineDialogProps) => {
  const { account: walletAddress } = useAccount();
  const [proposalCreated, setProposalCreated] = useState(false);
  const [latestEngine, setLatestEngine] = useState<`0x${string}` | null>(null);
  const [engineLoadError, setEngineLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setProposalCreated(false);
      setLatestEngine(null);
      setEngineLoadError(null);
      return;
    }
    setEngineLoadError(null);
    (async () => {
      try {
        const client = getClient(network);
        const globals = new Globals(network, client);
        const latest = await globals.getLatestProposalEngineImpl();
        setLatestEngine(latest);
      } catch (e) {
        setEngineLoadError(e instanceof Error ? e.message : String(e));
        setLatestEngine(null);
      }
    })();
  }, [open, network]);

  const buildTx = async () => {
    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }
    if (!latestEngine) {
      throw new Error("Could not load latest proposal engine");
    }

    const client = getClient(network);
    const party = await Party.create(network, partyAddress, client);
    const now = Math.floor(Date.now() / 1000);
    const maxExecutableTime = String(now + MAX_EXECUTABLE_TIME_DAYS * 24 * 60 * 60);
    const latestSnapIndex = await party.findVotingPowerSnapshotIndex(walletAddress, now);

    return party.generateUpgradeProposalEngineTx(
      latestEngine,
      "0x" as `0x${string}`,
      maxExecutableTime,
      String(CANCEL_DELAY_SECONDS),
      latestSnapIndex.toString()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Upgrade Proposal Engine</DialogTitle>
        <DialogDescription>
          Create a proposal to upgrade this Party&apos;s proposal execution engine to the latest
          implementation from the protocol. This upgrade should be done before any OpenSea listings
          or WalletConnect proposals.
        </DialogDescription>
        {proposalCreated ? (
          <p className="mt-4 text-sm font-medium text-green-600">Proposal created!</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {engineLoadError !== null && (
              <p className="text-destructive text-sm">
                Could not load upgrade target: {engineLoadError}
              </p>
            )}
            {!isMember && (
              <p className="text-destructive text-sm">
                Must be a member of party to submit proposal
              </p>
            )}
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName="Create proposal"
              disabled={!isMember || latestEngine === null || engineLoadError !== null}
              onSuccess={() => setProposalCreated(true)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

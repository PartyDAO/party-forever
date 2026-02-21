import { type NetworkName, Party } from "@party-forever/contracts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { formatEther } from "viem";

import { useWalletConnectProposal } from "@/components/proposal/useWalletConnectProposal.ts";
import { AdvancedProposalOptions } from "@/components/ui/AdvancedProposalOptions.tsx";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  useAccount
} from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

interface WalletConnectProposalDialogProps {
  network: NetworkName;
  partyAddress: `0x${string}`;
}

interface AdvancedFormData {
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

export const WalletConnectProposalDialog = ({
  network,
  partyAddress
}: WalletConnectProposalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [proposalCreated, setProposalCreated] = useState(false);
  const [wcUri, setWcUri] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<"loading" | "member" | "not-member">(
    "loading"
  );
  const { account: walletAddress } = useAccount();

  const {
    projectIdMissing,
    isConnecting,
    walletConnectError,
    onWalletConnectUriSubmit,
    dapp,
    callRequest,
    clearCallRequest,
    onDisconnect
  } = useWalletConnectProposal({
    network,
    partyAddress,
    canSendValue: true
  });

  const { register, getValues } = useForm<AdvancedFormData>({
    defaultValues: {
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    }
  });

  useEffect(() => {
    if (!open || !walletAddress) {
      setMembershipStatus("loading");
      return;
    }
    const checkMembership = async () => {
      setMembershipStatus("loading");
      try {
        const client = getClient(network);
        const party = await Party.create(network, partyAddress, client);
        const balance = await party.balanceOf(walletAddress);
        setMembershipStatus(balance > 0n ? "member" : "not-member");
      } catch {
        setMembershipStatus("not-member");
      }
    };
    checkMembership();
  }, [open, walletAddress, network, partyAddress]);

  const buildTx = async () => {
    if (!callRequest?.params?.[0] || !walletAddress) {
      throw new Error("Missing transaction data or wallet not connected");
    }
    const params = callRequest.params[0];
    const target = params.to as `0x${string}`;
    const data = (params.data ?? "0x") as `0x${string}`;
    const valueBigInt =
      params.value !== undefined && params.value !== null ? BigInt(String(params.value)) : 0n;

    const formValues = getValues();
    const maxExecutableTimeDays = Number(formValues.maxExecutableTimeDays);
    if (Number.isNaN(maxExecutableTimeDays) || maxExecutableTimeDays <= 0) {
      throw new Error("Max executable time must be a positive number of days");
    }
    const cancelDelay = Number(formValues.cancelDelay);
    if (Number.isNaN(cancelDelay) || cancelDelay <= 0) {
      throw new Error("Cancel delay must be a positive number");
    }

    const client = getClient(network);
    const party = await Party.create(network, partyAddress, client);
    const now = Math.floor(Date.now() / 1000);
    const maxExecutableTime = String(now + maxExecutableTimeDays * 24 * 60 * 60);
    const latestSnapIndex = await party.findVotingPowerSnapshotIndex(walletAddress, now);

    return party.generateArbitraryBytecodeProposalTx({
      maxExecutableTime,
      cancelDelay: String(cancelDelay),
      latestSnapIndex: latestSnapIndex.toString(),
      target,
      data,
      value: valueBigInt
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      onDisconnect();
      setWcUri("");
      if (proposalCreated) {
        clearCallRequest();
      }
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Use WalletConnect</Button>
      </DialogTrigger>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>WalletConnect Proposal</DialogTitle>
        <DialogDescription>
          Connect to a dapp via WalletConnect and create a proposal from the transaction it
          requests. The Party will vote on the proposal before any execution.
        </DialogDescription>

        {proposalCreated ? (
          <p className="text-sm font-medium text-green-600 mt-4">Proposal created!</p>
        ) : projectIdMissing ? (
          <p className="text-sm text-muted-foreground mt-4">
            Set <code className="bg-muted px-1 rounded">VITE_WALLETCONNECT_PROJECT_ID</code> in your
            environment to use WalletConnect proposals. Get a project ID at{" "}
            <a
              href="https://cloud.walletconnect.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              cloud.walletconnect.com
            </a>
            .
          </p>
        ) : !callRequest ? (
          <div className="flex flex-col gap-4 mt-4">
            {!(dapp?.name || dapp?.url) && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wc-uri">WalletConnect link</Label>
                  <Input
                    id="wc-uri"
                    placeholder="wc:…"
                    value={wcUri}
                    onChange={(e) => setWcUri(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sign into an app using WalletConnect and paste the link here.
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={!wcUri.trim() || isConnecting}
                  onClick={async () => {
                    const ok = await onWalletConnectUriSubmit(wcUri.trim());
                    if (ok) setWcUri("");
                  }}
                >
                  {isConnecting ? "Connecting…" : "Connect"}
                </Button>
              </>
            )}
            {(dapp?.name || dapp?.url) && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/40">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Connected to {dapp.name || dapp.url}
                </p>
                <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Waiting for the app to send a transaction…
                </p>
              </div>
            )}
            {walletConnectError && <p className="text-sm text-destructive">{walletConnectError}</p>}
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {dapp?.name || dapp?.url ? (
              <p className="text-sm text-muted-foreground">Request from {dapp.name || dapp.url}</p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Target</span>
              <span className="font-mono break-all">{callRequest.params[0].to}</span>
              <span className="text-muted-foreground">Value (ETH)</span>
              <span>{formatEther(BigInt(String(callRequest.params[0].value ?? 0)))}</span>
              <span className="text-muted-foreground">Data</span>
              <span className="font-mono break-all text-xs">
                {(callRequest.params[0].data ?? "0x").slice(0, 66)}
                {(callRequest.params[0].data ?? "0x").length > 66 ? "…" : ""}
              </span>
            </div>
            <AdvancedProposalOptions register={register} idPrefix="wc-" />
            {membershipStatus === "not-member" && (
              <p className="text-sm text-destructive">
                Must be a member of party to submit proposal
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearCallRequest();
                  onDisconnect();
                }}
              >
                Cancel
              </Button>
              <Web3Button
                networkName={network}
                txnFn={buildTx}
                actionName="Submit for Voting"
                disabled={membershipStatus !== "member"}
                onSuccess={() => setProposalCreated(true)}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

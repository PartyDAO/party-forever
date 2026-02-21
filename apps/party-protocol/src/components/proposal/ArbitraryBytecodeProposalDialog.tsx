import { type NetworkName, Party } from "@party-forever/contracts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { parseEther } from "viem";

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
  Textarea,
  useAccount
} from "@party-forever/ui";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";

interface ArbitraryBytecodeProposalDialogProps {
  network: NetworkName;
  partyAddress: `0x${string}`;
}

interface FormData {
  target: string;
  data: string;
  value: string;
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

export const ArbitraryBytecodeProposalDialog = ({
  network,
  partyAddress
}: ArbitraryBytecodeProposalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [proposalCreated, setProposalCreated] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<"loading" | "member" | "not-member">(
    "loading"
  );
  const { account: walletAddress } = useAccount();

  const { register, getValues } = useForm<FormData>({
    defaultValues: {
      target: "",
      data: "0x",
      value: "0",
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
    const formValues = getValues();

    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    if (!formValues.target.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid target address");
    }

    if (!formValues.data.match(/^0x[a-fA-F0-9]*$/)) {
      throw new Error("Invalid calldata (must be hex starting with 0x)");
    }

    const maxExecutableTimeDays = Number(formValues.maxExecutableTimeDays);
    if (Number.isNaN(maxExecutableTimeDays) || maxExecutableTimeDays <= 0) {
      throw new Error("Max executable time must be a positive number of days");
    }

    const cancelDelay = Number(formValues.cancelDelay);
    if (Number.isNaN(cancelDelay) || cancelDelay <= 0) {
      throw new Error("Cancel delay must be a positive number");
    }

    let valueBigInt = 0n;
    if (formValues.value && formValues.value !== "0") {
      try {
        const parsed = Number.parseFloat(formValues.value);
        if (Number.isNaN(parsed) || parsed < 0) {
          throw new Error("Must be a non-negative number");
        }
        valueBigInt = parseEther(formValues.value);
      } catch (e) {
        if (e instanceof Error && e.message === "Must be a non-negative number") {
          throw e;
        }
        throw new Error("Invalid ETH amount");
      }
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
      target: formValues.target as `0x${string}`,
      data: formValues.data as `0x${string}`,
      value: valueBigInt
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Arbitrary Bytecode Proposal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>New Arbitrary Bytecode Proposal</DialogTitle>
        <DialogDescription>
          Create a proposal to execute an arbitrary call from this Party.
        </DialogDescription>
        {proposalCreated ? (
          <p className="text-sm font-medium text-green-600 mt-4">Proposal created!</p>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="proposal-target">Target Address</Label>
              <Input id="proposal-target" placeholder="0x..." {...register("target")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proposal-data">Calldata</Label>
              <Textarea id="proposal-data" placeholder="0x..." rows={4} {...register("data")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="proposal-value">Value (ETH)</Label>
              <Input id="proposal-value" type="text" placeholder="0" {...register("value")} />
            </div>
            <AdvancedProposalOptions register={register} idPrefix="proposal-" />
            {membershipStatus === "not-member" && (
              <p className="text-sm text-destructive">
                Must be a member of party to submit proposal
              </p>
            )}
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName="Submit Proposal"
              disabled={membershipStatus !== "member"}
              onSuccess={() => setProposalCreated(true)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

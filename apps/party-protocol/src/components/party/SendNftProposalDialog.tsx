import { ERC721, type NetworkName, Party } from "@party-forever/contracts";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { AdvancedProposalOptions } from "@/components/ui/AdvancedProposalOptions.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Label,
  useAccount
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client";

interface SendNftProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  isMember: boolean;
  initialNftContractAddress?: string;
  initialNftTokenId?: string;
}

interface FormData {
  nftContractAddress: string;
  nftTokenId: string;
  recipientAddress: string;
  maxExecutableTimeDays: string;
  cancelDelay: string;
}

export const SendNftProposalDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  isMember,
  initialNftContractAddress = "",
  initialNftTokenId = ""
}: SendNftProposalDialogProps) => {
  const [proposalCreated, setProposalCreated] = useState(false);
  const { account: walletAddress } = useAccount();

  const { register, getValues, reset } = useForm<FormData>({
    defaultValues: {
      nftContractAddress: "",
      nftTokenId: "",
      recipientAddress: "",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    }
  });

  useEffect(() => {
    if (!open) {
      setProposalCreated(false);
      return;
    }
    reset({
      nftContractAddress: initialNftContractAddress ?? "",
      nftTokenId: initialNftTokenId ?? "",
      recipientAddress: "",
      maxExecutableTimeDays: "90",
      cancelDelay: "3628800"
    });
  }, [open, initialNftContractAddress, initialNftTokenId, reset]);

  const buildTx = async () => {
    const formValues = getValues();

    if (!walletAddress) {
      throw new Error("Wallet not connected");
    }

    const nftContract = formValues.nftContractAddress.trim();
    if (!nftContract.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid NFT contract address");
    }

    const tokenId = formValues.nftTokenId.trim();
    if (!tokenId) {
      throw new Error("Token ID is required");
    }

    const recipient = formValues.recipientAddress.trim();
    if (!recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new Error("Invalid recipient address");
    }

    const client = getClient(network);
    const erc721 = new ERC721(network, nftContract as `0x${string}`, client);
    const data = erc721.encodeTransferFrom(
      partyAddress,
      recipient as `0x${string}`,
      BigInt(tokenId)
    );
    const party = await Party.create(network, partyAddress, client);

    const maxExecutableTimeDays = Number(formValues.maxExecutableTimeDays);
    if (Number.isNaN(maxExecutableTimeDays) || maxExecutableTimeDays <= 0) {
      throw new Error("Max executable time must be a positive number of days");
    }
    const cancelDelayNum = Number(formValues.cancelDelay);
    if (Number.isNaN(cancelDelayNum) || cancelDelayNum <= 0) {
      throw new Error("Cancel delay must be a positive number of seconds");
    }

    const now = Math.floor(Date.now() / 1000);
    const maxExecutableTime = String(now + maxExecutableTimeDays * 24 * 60 * 60);

    const latestSnapIndex = await party.findVotingPowerSnapshotIndex(walletAddress, now);

    return party.generateArbitraryBytecodeProposalTx({
      maxExecutableTime,
      cancelDelay: String(cancelDelayNum),
      latestSnapIndex: latestSnapIndex.toString(),
      target: nftContract as `0x${string}`,
      data,
      value: 0n
    });
  };

  const handleSuccess = () => {
    setProposalCreated(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Propose sending NFT</DialogTitle>
        <DialogDescription>
          Create a proposal to send this NFT from the party to an address. The proposal must pass
          and be executed for the transfer to occur.
        </DialogDescription>
        <p className="text-muted-foreground text-sm">
          You can view the party&apos;s NFT inventory on{" "}
          <EtherscanLink
            network={network}
            address={partyAddress}
            addressType="address"
            text="etherscan"
          />{" "}
          or on the Inventory tab.
        </p>
        <p className="text-muted-foreground text-sm italic">
          Legacy parties must get 100% acceptance to be able to send NFTs.
        </p>
        {proposalCreated ? (
          <p className="mt-4 text-sm font-medium text-green-600">Proposal created!</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="send-nft-contract">NFT contract address</Label>
              <Input
                id="send-nft-contract"
                placeholder="0x..."
                {...register("nftContractAddress")}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="send-nft-token-id">Token ID</Label>
              <Input id="send-nft-token-id" placeholder="0" {...register("nftTokenId")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="send-nft-recipient">Recipient address</Label>
              <Input
                id="send-nft-recipient"
                placeholder="0x..."
                {...register("recipientAddress")}
              />
            </div>
            <AdvancedProposalOptions register={register} idPrefix="send-nft-" />
            {!isMember && (
              <p className="text-destructive text-sm">
                You must be a member of the party to submit a proposal.
              </p>
            )}
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName="Submit proposal"
              disabled={!isMember}
              onSuccess={handleSuccess}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

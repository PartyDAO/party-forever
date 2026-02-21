import { NULL_ADDRESS, type NetworkName, Party, type PartyMember } from "@party-forever/contracts";
import { useEffect, useState } from "react";

import { UpdateDelegationDialog } from "@/components/party/UpdateDelegationDialog";
import { Button, useAccount } from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { getClient } from "@/lib/client.ts";
import { LARGE_PARTY_THRESHOLD } from "@/lib/constants.ts";
import { calculateOwnershipBps, formatBps } from "@/lib/format.ts";

interface PartyMembersProps {
  network: NetworkName;
  partyAddress: `0x${string}`;
  totalVotingPower: bigint | null;
  isMember?: boolean;
  isNftParty: boolean;
  active?: boolean;
}

export const PartyMembers = ({
  network,
  partyAddress,
  totalVotingPower,
  isMember = false,
  isNftParty,
  active = true
}: PartyMembersProps) => {
  const { account: connectedAddress } = useAccount();
  const [members, setMembers] = useState<PartyMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegationDialogOpen, setDelegationDialogOpen] = useState(false);
  const [isLargeParty, setIsLargeParty] = useState<boolean | null>(null);

  async function fetchMembers() {
    console.log("fetching members");
    setLoading(true);
    setError(null);

    try {
      const client = getClient(network);
      const party = await Party.create(network, partyAddress, client);

      if (!isNftParty) {
        const tokenCount = await party.getTokenCount();
        if (tokenCount > LARGE_PARTY_THRESHOLD) {
          setIsLargeParty(true);
          setLoading(false);
          return;
        }
        setIsLargeParty(false);
      }

      const fetchedMembers = await party.getMembers();
      setMembers(fetchedMembers);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (active && !members && isLargeParty === null) {
      fetchMembers();
    }
  }, [active, network, partyAddress]);

  if (error) {
    return <div className="text-destructive text-sm">Error fetching members: {error}</div>;
  }

  if (loading || (isLargeParty === null && members === null && active)) {
    return <div className="flex justify-center">Loading...</div>;
  }

  if (isLargeParty) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-muted-foreground">This party has too many members to display here.</p>
        <EtherscanLink
          network={network}
          address={partyAddress}
          addressType="token"
          hash="balances"
          text="View token holders on block explorer"
        />
      </div>
    );
  }

  if (members === null) {
    return <div className="flex justify-center">Loading...</div>;
  }

  if (members.length === 0) {
    return <p className="text-muted-foreground">No members found</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {isMember && (
        <div>
          <Button type="button" onClick={() => setDelegationDialogOpen(true)}>
            Update delegation
          </Button>
        </div>
      )}
      <UpdateDelegationDialog
        open={delegationDialogOpen}
        onOpenChange={setDelegationDialogOpen}
        network={network}
        partyAddress={partyAddress}
        members={members}
        totalVotingPower={totalVotingPower!}
        connectedAddress={connectedAddress ?? undefined}
        onSuccess={fetchMembers}
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4">Address</th>
              <th className="text-left py-2 pr-4">Token IDs</th>
              <th className="text-left py-2 pr-4">Ownership</th>
              <th className="text-left py-2 pr-4">Voting Power</th>
              <th className="text-left py-2">Delegated To</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.partyMemberAddress} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  <span
                    className={
                      connectedAddress &&
                      member.partyMemberAddress.toLowerCase() === connectedAddress.toLowerCase()
                        ? "font-bold"
                        : undefined
                    }
                  >
                    <EtherscanLink
                      network={network}
                      address={member.partyMemberAddress}
                      addressType="address"
                    />
                    {connectedAddress &&
                      member.partyMemberAddress.toLowerCase() === connectedAddress.toLowerCase() &&
                      "(you)"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  {member.tokenIds.map((id) => id.toString()).join(", ")}
                </td>
                <td className="py-2 pr-4">
                  {formatBps(
                    calculateOwnershipBps(member.totalIntrinsicVotingPower, totalVotingPower!)
                  )}
                </td>
                <td className="py-2 pr-4">
                  {formatBps(calculateOwnershipBps(member.currentVotingPower, totalVotingPower!))}
                </td>
                <td className="py-2">
                  {member.delegatedTo.toLowerCase() === NULL_ADDRESS ? (
                    <span className="text-muted-foreground">None</span>
                  ) : member.delegatedTo.toLowerCase() ===
                    member.partyMemberAddress.toLowerCase() ? (
                    <span className="text-muted-foreground">Self</span>
                  ) : (
                    <EtherscanLink
                      network={network}
                      address={member.delegatedTo}
                      addressType="address"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

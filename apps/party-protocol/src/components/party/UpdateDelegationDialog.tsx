import { NULL_ADDRESS, type NetworkName, Party, type PartyMember } from "@party-forever/contracts";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Input,
  Label
} from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import { Web3Button } from "@/components/ui/Web3Button.tsx";
import { getClient } from "@/lib/client.ts";
import { calculateOwnershipBps, formatBps } from "@/lib/format.ts";

interface UpdateDelegationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  network: NetworkName;
  partyAddress: `0x${string}`;
  members: PartyMember[];
  totalVotingPower: bigint;
  connectedAddress: `0x${string}` | undefined;
  onSuccess?: () => void;
}

export const UpdateDelegationDialog = ({
  open,
  onOpenChange,
  network,
  partyAddress,
  members,
  totalVotingPower,
  connectedAddress,
  onSuccess
}: UpdateDelegationDialogProps) => {
  const [delegateInput, setDelegateInput] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sortedMembers = useMemo(
    () => [...members].sort((a, b) => (a.currentVotingPower > b.currentVotingPower ? -1 : 1)),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = delegateInput.trim().toLowerCase();
    if (!q) return sortedMembers;
    return sortedMembers.filter(
      (m) =>
        m.partyMemberAddress.toLowerCase().includes(q) ||
        m.partyMemberAddress.toLowerCase().startsWith(q)
    );
  }, [sortedMembers, delegateInput]);

  const normalizedInput = delegateInput.trim();
  const isValidEthAddress = /^0x[a-fA-F0-9]{40}$/.test(normalizedInput);
  const matchingMember = useMemo(
    () => members.find((m) => m.partyMemberAddress.toLowerCase() === normalizedInput.toLowerCase()),
    [members, normalizedInput]
  );
  const isNonMemberAddress = isValidEthAddress && normalizedInput.length > 0 && !matchingMember;
  const canSubmit = normalizedInput.length > 0 && isValidEthAddress;
  const delegateAddressForTx = canSubmit
    ? (matchingMember?.partyMemberAddress ?? (normalizedInput as `0x${string}`))
    : null;

  const currentDelegation = useMemo(() => {
    if (!connectedAddress) return null;
    const me = members.find(
      (m) => m.partyMemberAddress.toLowerCase() === connectedAddress.toLowerCase()
    );
    if (!me) return null;
    if (me.delegatedTo.toLowerCase() === NULL_ADDRESS) return "None";
    if (me.delegatedTo.toLowerCase() === me.partyMemberAddress.toLowerCase()) return "Self";
    return me.delegatedTo as `0x${string}`;
  }, [members, connectedAddress]);

  const buildTx = async () => {
    if (!delegateAddressForTx) {
      throw new Error("Select or enter a party member address to delegate to");
    }
    const client = getClient(network);
    const party = await Party.create(network, partyAddress, client);
    const txData = party.getDelegateVotingPowerTxData(delegateAddressForTx);
    if (!txData) {
      throw new Error("This party does not support delegation");
    }
    return { ...txData, value: 0n as bigint };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Update delegation</DialogTitle>
        <DialogDescription>
          Delegate your voting power to another party member. When you delegate, your votes will
          count toward the selected member when they vote on proposals.
        </DialogDescription>
        <p className="text-muted-foreground text-sm">
          Updating your delegation does not affect ownership of your party membership.
        </p>
        {currentDelegation !== null && (
          <p className="text-sm">
            Currently delegating to:{" "}
            {currentDelegation === "None" || currentDelegation === "Self" ? (
              <span className="text-muted-foreground">{currentDelegation}</span>
            ) : (
              <EtherscanLink network={network} address={currentDelegation} addressType="address" />
            )}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="delegate-input">Delegate to</Label>
            <div className="relative">
              <Input
                id="delegate-input"
                value={delegateInput}
                onChange={(e) => setDelegateInput(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                placeholder="Paste address or search members..."
                className="font-mono"
                autoComplete="off"
              />
              {dropdownOpen && filteredMembers.length > 0 && (
                <div
                  className="border-input bg-popover text-popover-foreground absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-md"
                  aria-label="Party members"
                >
                  {filteredMembers.map((member) => {
                    const bps = calculateOwnershipBps(member.currentVotingPower, totalVotingPower);
                    const isYou =
                      connectedAddress &&
                      member.partyMemberAddress.toLowerCase() === connectedAddress.toLowerCase();
                    const label = `${formatBps(bps)} — ${member.partyMemberAddress}${isYou ? " (you)" : ""}`;
                    return (
                      <button
                        key={member.partyMemberAddress}
                        type="button"
                        className="w-full cursor-pointer px-3 py-2 text-left text-sm font-mono hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDelegateInput(member.partyMemberAddress);
                          setDropdownOpen(false);
                        }}
                        onClick={() => {
                          setDelegateInput(member.partyMemberAddress);
                          setDropdownOpen(false);
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {isNonMemberAddress && (
              <p className="text-amber-600 dark:text-amber-500 text-sm">
                Warning: This address is not a party member.
              </p>
            )}
          </div>
          {connectedAddress && (
            <Web3Button
              networkName={network}
              txnFn={buildTx}
              actionName="Update delegation"
              disabled={!canSubmit}
              onSuccess={() => {
                onSuccess?.();
                onOpenChange(false);
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

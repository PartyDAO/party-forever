import {
  BondingCurveAuthority,
  type Distribution,
  type GovernanceValues,
  type NetworkName,
  Party,
  PartyFactory,
  type PartyCreationData,
  type ProposedEvent,
  RAGE_QUIT_FOREVER,
  TokenDistributor,
  type TxData
} from "@party-forever/contracts";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";

import { GovernanceTab } from "@/components/crowdfund/GovernanceTab";
import { DistributionsTab } from "@/components/distribution/DistributionsTab";
import { DynamicParty } from "@/components/party/DynamicParty";
import { InventoryTab } from "@/components/party/InventoryTab";
import { PartyMembers } from "@/components/party/PartyMembers";
import { RageQuitDialog } from "@/components/party/RageQuitDialog";
import { SendNftProposalDialog } from "@/components/party/SendNftProposalDialog";
import { SendTokenProposalDialog } from "@/components/party/SendTokenProposalDialog";
import { OpenseaSaleProposalDialog } from "@/components/proposal/OpenseaSaleProposalDialog.tsx";
import { DistributionDialog } from "@/components/proposal/DistributionDialog.tsx";
import { ProposalsTab } from "@/components/proposal/ProposalsTab.tsx";
import {
  cn,
  ErrorDisplay,
  Loading,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useAccount
} from "@party-forever/ui";
import { getClient } from "@/lib/client.ts";
import { VALID_NETWORKS } from "@/lib/constants.ts";
import { getImageUrlFromContractUri } from "@/lib/utils.ts";

const VALID_TABS = [
  "governance",
  "buysell",
  "members",
  "proposals",
  "distributions",
  "inventory"
] as const;
type TabValue = (typeof VALID_TABS)[number];
const DEFAULT_TAB: TabValue = "governance";

function getTabFromHash(hash: string): TabValue {
  const tabValue = hash.replace(/^#/, "");
  if (VALID_TABS.includes(tabValue as TabValue)) {
    return tabValue as TabValue;
  }
  return DEFAULT_TAB;
}

interface PartyData {
  name: string;
  contractURI: string;
  governanceValues: GovernanceValues;
  proposals: ProposedEvent[];
  distributions: Distribution[];
  rageQuitTimestamp: number | null;
  supportsSetRageQuit: boolean;
  enableRageQuitTxData: TxData | null;
  disableRageQuitTxData: TxData | null;
  isNftParty: boolean;
  isDynamicParty: boolean;
  bondingCurveAuthorityAddress: `0x${string}` | null;
  membershipPrice: bigint | null;
}

export const PartyDetails = () => {
  const { network, address } = useParams<{
    network: string;
    address: string;
  }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { account: connectedAddress } = useAccount();

  const currentTab = getTabFromHash(location.hash);

  const networkName = network as NetworkName;
  const partyAddress = address as `0x${string}`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PartyData | null>(null);
  const [party, setParty] = useState<Party | null>(null);

  const { data: tokenIds } = useQuery({
    queryKey: ["partyMember", connectedAddress, partyAddress, networkName, party],
    queryFn: async () => {
      if (!connectedAddress || !party) return [];
      return party.getTokenIdsOwnedByAddress(connectedAddress);
    },
    enabled: Boolean(connectedAddress && party)
  });

  const isMember = (tokenIds?.length ?? 0) > 0;

  const { data: isHost } = useQuery({
    queryKey: ["partyHost", connectedAddress, partyAddress, networkName, isMember, party],
    queryFn: async () => {
      if (!isMember || !connectedAddress || !party) return false;
      return party.isHost(connectedAddress);
    },
    enabled: Boolean(isMember && party)
  });

  const handleTabChange = (value: string) => {
    navigate(`#${value}`, { replace: true });
  };

  const { data: partyCreationData } = useQuery({
    queryKey: ["partyCreationData", partyAddress, networkName],
    queryFn: async (): Promise<PartyCreationData | null> => {
      try {
        const client = getClient(networkName);
        const partyFactory = new PartyFactory(networkName, client);
        return await partyFactory.fetchPartyCreationData(partyAddress);
      } catch (e) {
        console.log("Could not find party creation data for party", partyAddress, e);
        return null;
      }
    },
    enabled: Boolean(partyAddress && network),
    retry: false
  });

  const [sendNftDialogOpen, setSendNftDialogOpen] = useState(false);
  const [sendNftInitial, setSendNftInitial] = useState<{
    nftContractAddress: string;
    nftTokenId: string;
  }>({ nftContractAddress: "", nftTokenId: "" });
  const [sendTokenDialogOpen, setSendTokenDialogOpen] = useState(false);
  const [sendTokenInitial, setSendTokenInitial] = useState<{
    tokenAddress: string;
    decimals?: number;
  }>({ tokenAddress: "" });
  const [distributionDialogOpen, setDistributionDialogOpen] = useState(false);
  const [distributionInitial, setDistributionInitial] = useState<{
    tokenAddress?: string;
    amount?: string;
  }>({});
  const [openseaSaleDialogOpen, setOpenseaSaleDialogOpen] = useState(false);
  const [openseaSaleInitial, setOpenseaSaleInitial] = useState<{
    tokenAddress?: string;
    tokenId?: string;
  }>({});
  const [rageQuitDialogOpen, setRageQuitDialogOpen] = useState(false);

  const openSendNftDialog = (nftContractAddress?: string, nftTokenId?: string) => {
    setSendNftInitial({
      nftContractAddress: nftContractAddress ?? "",
      nftTokenId: nftTokenId ?? ""
    });
    setSendNftDialogOpen(true);
  };

  const openSendTokenDialog = (tokenAddress?: string, decimals?: number) => {
    setSendTokenInitial({
      tokenAddress: tokenAddress ?? "",
      decimals
    });
    setSendTokenDialogOpen(true);
  };

  const openDistributionDialog = (tokenAddress?: string, amount?: string) => {
    setDistributionInitial({
      tokenAddress,
      amount
    });
    setDistributionDialogOpen(true);
  };

  const openOpenseaSaleDialog = (nftContractAddress?: string, nftTokenId?: string) => {
    setOpenseaSaleInitial({
      tokenAddress: nftContractAddress,
      tokenId: nftTokenId
    });
    setOpenseaSaleDialogOpen(true);
  };

  const fetchData = useCallback(async () => {
    if (!network || !address) {
      setError("Missing network or address");
      setLoading(false);
      return;
    }

    if (!VALID_NETWORKS.includes(network as (typeof VALID_NETWORKS)[number])) {
      setError(`Invalid network: ${network}`);
      setLoading(false);
      return;
    }

    setError(null);
    setParty(null);
    try {
      const client = getClient(network as NetworkName);
      const p = await Party.create(networkName, partyAddress, client);
      const tokenDistributor = TokenDistributor.create(network as NetworkName, client);

      const [partyInfo, proposals, distributions, bondingCurveAuthorityAddress] = await Promise.all(
        [
          p.getPartyInfo(),
          p.fetchProposals(),
          tokenDistributor.fetchDistributions(address as `0x${string}`),
          p.getBondingCurveAuthorityAddressBatched()
        ]
      );

      let membershipPrice: bigint | null = null;
      if (bondingCurveAuthorityAddress) {
        const authority = await BondingCurveAuthority.create(
          network as NetworkName,
          bondingCurveAuthorityAddress,
          client
        );
        membershipPrice = await authority.getPriceToBuy(address as `0x${string}`, 1n);
      }

      setData({
        name: partyInfo.name,
        contractURI: partyInfo.contractURI,
        governanceValues: partyInfo.governanceValues,
        proposals,
        distributions,
        rageQuitTimestamp: partyInfo.rageQuitTimestamp,
        supportsSetRageQuit: p.supportsSetRageQuit(),
        enableRageQuitTxData: p.getSetRageQuitTxData(RAGE_QUIT_FOREVER),
        disableRageQuitTxData: p.getSetRageQuitTxData(0),
        isNftParty: partyInfo.isNftParty,
        isDynamicParty: bondingCurveAuthorityAddress != null,
        bondingCurveAuthorityAddress,
        membershipPrice
      });
      setParty(p);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [network, address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (data?.name) {
      document.title = `${data.name} | Party Forever`;
    }
    return () => {
      document.title = "Party Forever";
    };
  }, [data?.name]);

  if (loading) {
    return <Loading message="Loading party data..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} backLink="/search" backLabel="Back to Search" />;
  }

  if (!data || !party) {
    return null;
  }

  const partyImageUrl = getImageUrlFromContractUri(data.contractURI);

  return (
    <div className="md:px-6 px-3 py-6 flex flex-col items-center gap-6">
      <div className="flex items-center gap-4">
        {partyImageUrl && (
          <img
            src={partyImageUrl}
            alt={data.name}
            className="size-24 rounded-xl object-cover shrink-0 ring-2 ring-[#00d4ff]/20"
          />
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold party-gradient-text">{data.name}</h1>
          <span className="text-xs text-muted-foreground">
            {data.isDynamicParty
              ? "Rooms Party"
              : data.isNftParty
                ? "Partybid (NFT Party)"
                : "Party (ETH Party)"}
          </span>
          {connectedAddress && (
            <span
              className={cn(
                "text-xs font-medium inline-flex items-center gap-1",
                isMember ? "text-green-400" : "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  isMember ? "bg-green-400" : "bg-muted-foreground"
                )}
              />
              {isMember ? "Member" : "Not a member"}
            </span>
          )}
        </div>
      </div>

      <div className="w-full min-w-0">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="flex-nowrap w-full md:[&>*]:flex-1">
            <TabsTrigger value="governance">Governance</TabsTrigger>
            {data.isDynamicParty && <TabsTrigger value="buysell">Buy/Sell</TabsTrigger>}
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="proposals">Proposals ({data.proposals.length})</TabsTrigger>
            <TabsTrigger value="distributions">
              Distributions ({data.distributions.length})
            </TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>
          <TabsContent value="governance">
            <GovernanceTab
              governanceValues={data.governanceValues}
              partyName={data.name}
              partyAddress={address as `0x${string}`}
              network={network as NetworkName}
              rageQuitTimestamp={data.rageQuitTimestamp}
              supportsSetRageQuit={data.supportsSetRageQuit}
              isHost={isHost ?? false}
              isMember={isMember}
              enableRageQuitTxData={data.enableRageQuitTxData}
              disableRageQuitTxData={data.disableRageQuitTxData}
              onRageQuitSuccess={fetchData}
              onOpenRageQuit={connectedAddress ? () => setRageQuitDialogOpen(true) : undefined}
              partyCreationData={partyCreationData ?? undefined}
            />
          </TabsContent>
          <TabsContent value="members" forceMount className="data-[state=inactive]:hidden">
            <PartyMembers
              active={currentTab === "members"}
              network={network as NetworkName}
              partyAddress={address as `0x${string}`}
              totalVotingPower={data.governanceValues.totalVotingPower}
              isMember={isMember}
              isNftParty={data.isNftParty}
            />
          </TabsContent>
          <TabsContent value="proposals">
            <ProposalsTab
              proposals={data.proposals}
              network={networkName}
              partyAddress={partyAddress}
              isMember={isMember}
              isHost={isHost ?? false}
              connectedAddress={connectedAddress ?? undefined}
              distributionType={data.isNftParty ? "direct" : "proposal"}
              isNftParty={data.isNftParty}
              partyCreationData={partyCreationData ?? undefined}
              onOpenSendNftDialog={openSendNftDialog}
              onOpenSendTokenDialog={openSendTokenDialog}
              onOpenDistributionDialog={openDistributionDialog}
              onOpenOpenseaSaleDialog={() => openOpenseaSaleDialog()}
              party={party}
            />
          </TabsContent>
          <TabsContent value="distributions">
            <DistributionsTab
              distributions={data.distributions}
              network={network as NetworkName}
              partyAddress={address as `0x${string}`}
              isMember={isMember}
              distributionButtonLabel={
                data.isNftParty ? "New Distribution" : "New Distribution Proposal"
              }
              onOpenDistributionDialog={openDistributionDialog}
            />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryTab
              partyAddress={address as `0x${string}`}
              network={network as NetworkName}
              isMember={isMember}
              onOpenSendNftDialog={openSendNftDialog}
              onOpenSendTokenDialog={openSendTokenDialog}
              onOpenDistributionDialog={openDistributionDialog}
              onOpenOpenseaSaleDialog={openOpenseaSaleDialog}
              isNftParty={data.isNftParty}
            />
          </TabsContent>
          {data.isDynamicParty && (
            <TabsContent value="buysell">
              <DynamicParty
                network={networkName}
                partyAddress={partyAddress}
                authorityAddress={data.bondingCurveAuthorityAddress}
                connectedAddress={connectedAddress ?? undefined}
                membershipPrice={data.membershipPrice}
                onSuccess={fetchData}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
      <SendTokenProposalDialog
        open={sendTokenDialogOpen}
        onOpenChange={setSendTokenDialogOpen}
        network={networkName}
        partyAddress={partyAddress}
        isMember={isMember}
        initialTokenAddress={sendTokenInitial.tokenAddress}
        initialDecimals={sendTokenInitial.decimals}
      />
      <SendNftProposalDialog
        open={sendNftDialogOpen}
        onOpenChange={setSendNftDialogOpen}
        network={networkName}
        partyAddress={partyAddress}
        isMember={isMember}
        initialNftContractAddress={sendNftInitial.nftContractAddress}
        initialNftTokenId={sendNftInitial.nftTokenId}
      />
      <DistributionDialog
        open={distributionDialogOpen}
        onOpenChange={setDistributionDialogOpen}
        network={networkName}
        partyAddress={partyAddress}
        isMember={isMember}
        distributionType={data.isNftParty ? "direct" : "proposal"}
        initialTokenAddress={distributionInitial.tokenAddress}
        initialAmount={distributionInitial.amount}
      />
      <OpenseaSaleProposalDialog
        open={openseaSaleDialogOpen}
        onOpenChange={setOpenseaSaleDialogOpen}
        network={networkName}
        partyAddress={partyAddress}
        isMember={isMember}
        initialTokenAddress={openseaSaleInitial.tokenAddress}
        initialTokenId={openseaSaleInitial.tokenId}
      />
      {connectedAddress && (
        <RageQuitDialog
          open={rageQuitDialogOpen}
          onOpenChange={setRageQuitDialogOpen}
          network={networkName}
          partyAddress={partyAddress}
          receiverAddress={connectedAddress}
          tokenIds={tokenIds ?? []}
          onSuccess={fetchData}
          party={party}
        />
      )}
    </div>
  );
};

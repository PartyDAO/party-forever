export interface APICrowdfundContribution {
  networkId: number;
  amount: string;
  blockNumber: number;
  logIndex: number;
  crowdfundAddress: string;
  contributor: string;
  transactionHash: string;
  delegate: string;
}

export interface APICrowdfund {
  networkId: number;
  crowdfundAddress: string;
  crowdfundType: string;
  protocolVersion: string;
  blockNumber: number;
  transactionHash: string;
  creator: string;
  expiry: number;
  opts_name: string;
  opts_symbol: string;
  opts_duration: string;
  opts_splitBps: number;
  opts_splitRecipient: string;
  opts_initialContributor: string;
  opts_initialDelegate: string;
  opts_gateKeeper: string;
  opts_gateKeeperId: string | null;
  opts_onlyHostCanBuy: boolean;
  opts_onlyHostCanBid: boolean;
  opts_maximumBid: string | null;
  opts_maximumPrice: string | null;
  opts_auctionId: string | null;
  opts_market: string | null;
  opts_nftContract: string | null;
  opts_nftTokenId: string | null;
  governanceOpts_executionDelay: number;
  governanceOpts_passThresholdBps: string;
  governanceOpts_feeBps: string;
  governanceOpts_feeRecipient: string;
  governanceOpts_voteDuration: string;
  governanceOpts_hosts: string | null;
  ethCrowdfund_minContribution: string | null;
  ethCrowdfund_maxContribution: string | null;
  ethCrowdfund_maxTotalContributions: string | null;
  ethCrowdfund_minTotalContributions: string | null;
  ethCrowdfund_exchangeRate: string | null;
  ethCrowdfund_exchangeRateBps: number | null;
  ethCrowdfund_fundingSplitBps: number | null;
  ethCrowdfund_fundingSplitRecipient: string | null;
  ethCrowdfund_party: string | null;
  tokenOpts_name: string | null;
  tokenOpts_symbol: string | null;
  tokenOpts_totalSupply: string | null;
  tokenOpts_recipient: string | null;
  tokenOpts_numTokensForDistribution: string | null;
  tokenOpts_numTokensForLP: string | null;
  tokenOpts_numTokensForRecipient: string | null;
  tokenOpts_lpFeeRecipient: string | null;
}

export interface APICrowdfundStatusUpdate {
  networkId: number;
  crowdfundAddress: string;
  crowdfundStatus: string;
  blockNumber: number;
  transactionHash: string;
  settledPrice: string | null;
  nftContract: string | null;
  nftTokenId: string | null;
  partyAddress: string | null;
}

export interface APIParty {
  networkId: number;
  address: string;
  blockNumber: number;
  transactionHash: string;
  creator: string;
  protocolVersion: string;
  opts_name: string;
  opts_symbol: string;
  opts_governance_executionDelay: number;
  opts_governance_passThresholdBps: string;
  opts_governance_feeBps: string;
  opts_governance_feeRecipient: string;
  opts_governance_voteDuration: string;
  opts_governance_totalVotingPower: string;
  opts_governance_hosts: string | null;
  preciousTokens: string | null;
  preciousTokenIds: string | null;
}

export interface APIManualPartyMember {
  networkId: number;
  partyAddress: string;
  member: string;
  votingPower: string;
  blockNumber: number;
  logIndex: number;
  transactionHash: string;
  inviteIndex: number;
}

export interface CrowdfundContributionSummary {
  crowdfundAddress: string;
  networkId: number;
  totalAmount: bigint;
  name: string;
  contributionCount: number;
  status: string | null;
  partyAddress: string | null;
}

export interface ManualPartyMembershipSummary {
  partyAddress: string;
  networkId: number;
  name: string;
}

import { DatasetteClient, type Filters } from "./datasette_client.ts";

interface PartyProtocolTables {
  CrowdfundContribution: APICrowdfundContribution;
  Crowdfund: APICrowdfund;
  CrowdfundStatusUpdate: APICrowdfundStatusUpdate;
  Party: APIParty;
  ManualPartyMember: APIManualPartyMember;
}

export class DbPartyProtocolClient extends DatasetteClient<PartyProtocolTables> {
  constructor(apiUrl: string) {
    super(apiUrl, "party_protocol");
  }

  async searchParties(
    name: string,
    opts: { networkId?: number; limit?: number } = {}
  ): Promise<APIParty[]> {
    const filters: Filters = { opts_name__contains: name };
    if (opts.networkId !== undefined) filters.networkId = opts.networkId;
    const { rows } = await this.query("Party", filters, {
      sort_desc: "blockNumber",
      limit: opts.limit ?? 20
    });
    return rows;
  }

  async searchCrowdfunds(
    name: string,
    opts: { networkId?: number; limit?: number } = {}
  ): Promise<APICrowdfund[]> {
    const filters: Filters = { opts_name__contains: name };
    if (opts.networkId !== undefined) filters.networkId = opts.networkId;
    const { rows } = await this.query("Crowdfund", filters, {
      sort_desc: "blockNumber",
      limit: opts.limit ?? 20
    });
    return rows;
  }

  /**
   * Given a list of crowdfund addresses, fetches the latest CrowdfundStatusUpdate
   * for each and returns a map from crowdfund address to party address (if known).
   */
  async getPartyAddressesForCrowdfunds(crowdfundAddresses: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (crowdfundAddresses.length === 0) return result;

    await Promise.all(
      crowdfundAddresses.map(async (crowdfundAddress) => {
        const { rows } = await this.query(
          "CrowdfundStatusUpdate",
          { crowdfundAddress },
          { sort_desc: "blockNumber", limit: 1 }
        );
        if (rows.length > 0 && rows[0].partyAddress) {
          result.set(crowdfundAddress, rows[0].partyAddress);
        }
      })
    );

    return result;
  }

  async getContributionSummaries(
    contributorAddress: string
  ): Promise<CrowdfundContributionSummary[]> {
    const { rows } = await this.query("CrowdfundContribution", {
      contributor: contributorAddress.toLowerCase()
    });

    const grouped = new Map<
      string,
      {
        crowdfundAddress: string;
        networkId: number;
        totalAmount: bigint;
        contributionCount: number;
      }
    >();
    for (const c of rows) {
      const key = c.crowdfundAddress;
      const existing = grouped.get(key);
      if (existing) {
        existing.totalAmount += BigInt(c.amount);
        existing.contributionCount += 1;
      } else {
        grouped.set(key, {
          crowdfundAddress: key,
          networkId: c.networkId,
          totalAmount: BigInt(c.amount),
          contributionCount: 1
        });
      }
    }

    const crowdfundAddresses = [...grouped.keys()];
    const nameMap = new Map<string, string>();
    const statusMap = new Map<string, { status: string; partyAddress: string | null }>();

    await Promise.all(
      crowdfundAddresses.map(async (crowdfundAddress) => {
        const [cfResult, statusResult] = await Promise.all([
          this.query("Crowdfund", { crowdfundAddress }),
          this.query(
            "CrowdfundStatusUpdate",
            { crowdfundAddress },
            { sort_desc: "blockNumber", limit: 1 }
          )
        ]);
        if (cfResult.rows.length > 0) {
          nameMap.set(crowdfundAddress, cfResult.rows[0].opts_name);
        }
        if (statusResult.rows.length > 0) {
          statusMap.set(crowdfundAddress, {
            status: statusResult.rows[0].crowdfundStatus,
            partyAddress: statusResult.rows[0].partyAddress
          });
        }
      })
    );

    return [...grouped.values()]
      .map((g) => ({
        ...g,
        name: nameMap.get(g.crowdfundAddress) ?? g.crowdfundAddress,
        status: statusMap.get(g.crowdfundAddress)?.status ?? null,
        partyAddress: statusMap.get(g.crowdfundAddress)?.partyAddress ?? null
      }))
      .sort((a, b) => (b.totalAmount > a.totalAmount ? 1 : b.totalAmount < a.totalAmount ? -1 : 0));
  }

  async getManualPartyMemberships(memberAddress: string): Promise<ManualPartyMembershipSummary[]> {
    const { rows } = await this.query("ManualPartyMember", {
      member: memberAddress.toLowerCase()
    });

    if (rows.length === 0) return [];

    // Dedupe by party address
    const grouped = new Map<string, { partyAddress: string; networkId: number }>();
    for (const r of rows) {
      const key = `${r.networkId}-${r.partyAddress.toLowerCase()}`;
      if (!grouped.has(key)) {
        grouped.set(key, { partyAddress: r.partyAddress, networkId: r.networkId });
      }
    }

    // Look up party names
    const entries = [...grouped.values()];
    const names = await Promise.all(
      entries.map(async (e) => {
        const { rows: partyRows } = await this.query("Party", {
          address: e.partyAddress
        });
        return partyRows.length > 0 ? partyRows[0].opts_name : e.partyAddress;
      })
    );

    return entries.map((e, i) => ({
      ...e,
      name: names[i]
    }));
  }
}

import { DatasetteClient } from "./datasette_client.ts";

export interface APIPartyBidParty {
  id: number;
  name: string;
  symbol: string;
  partyAddress: string;
  versionNumber: number;
  nftContractAddress: string;
  nftTokenId: number;
  marketWrapperAddress: string;
  auctionId: number;
  createdBy: string;
  transactionHash: string;
  splitRecipient: string;
  splitBasisPoints: number;
  blockNumber: number;
  gatedToken: string | null;
  gatedTokenAmount: string | null;
  partyType: string;
}

export interface APIPartyBidContribution {
  id: number;
  partyAddress: string;
  contributedBy: string;
  transactionHash: string;
  contributedAmountWei: number;
  blockNumber: number;
  previousTotalContributedToPartyWei: number;
  totalFromContributorWei: number;
  runId: number;
  partyId: number;
}

export interface APIPartyBidFinalized {
  id: number;
  partyAddress: string;
  versionNumber: number;
  transactionHash: string;
  totalSpentWei: number;
  feeWei: number;
  totalContributedWei: number;
  blockNumber: number;
  result: number;
  runId: number;
  partyId: number;
}

export interface PartyBidContributionSummary {
  partyAddress: string;
  name: string;
  totalAmount: bigint;
  contributionCount: number;
  result: number | null;
}

interface PartyBidTables {
  party: APIPartyBidParty;
  party_contribution: APIPartyBidContribution;
  party_finalized: APIPartyBidFinalized;
}

export class PartyBidApiClient extends DatasetteClient<PartyBidTables> {
  constructor(apiUrl: string) {
    super(apiUrl, "party_bid");
  }

  async getContributionSummaries(
    contributorAddress: string
  ): Promise<PartyBidContributionSummary[]> {
    const { rows } = await this.query("party_contribution", {
      contributedBy: contributorAddress.toLowerCase()
    });

    const grouped = new Map<
      string,
      {
        partyAddress: string;
        totalAmount: bigint;
        contributionCount: number;
      }
    >();
    for (const c of rows) {
      const key = c.partyAddress;
      const existing = grouped.get(key);
      if (existing) {
        existing.totalAmount += BigInt(c.contributedAmountWei);
        existing.contributionCount += 1;
      } else {
        grouped.set(key, {
          partyAddress: key,
          totalAmount: BigInt(c.contributedAmountWei),
          contributionCount: 1
        });
      }
    }

    const partyAddresses = [...grouped.keys()];
    const nameMap = new Map<string, string>();
    const resultMap = new Map<string, number>();

    await Promise.all(
      partyAddresses.map(async (partyAddress) => {
        const [partyResult, finalizedResult] = await Promise.all([
          this.query("party", { partyAddress }),
          this.query("party_finalized", { partyAddress }, { sort_desc: "blockNumber", limit: 1 })
        ]);
        if (partyResult.rows.length > 0) {
          nameMap.set(partyAddress, partyResult.rows[0].name);
        }
        if (finalizedResult.rows.length > 0) {
          resultMap.set(partyAddress, finalizedResult.rows[0].result);
        }
      })
    );

    return [...grouped.values()]
      .map((g) => ({
        ...g,
        name: nameMap.get(g.partyAddress) ?? g.partyAddress,
        result: resultMap.get(g.partyAddress) ?? null
      }))
      .sort((a, b) => (b.totalAmount > a.totalAmount ? 1 : b.totalAmount < a.totalAmount ? -1 : 0));
  }

  async searchParties(name: string, opts: { limit?: number } = {}): Promise<APIPartyBidParty[]> {
    const { rows } = await this.query(
      "party",
      { name__contains: name },
      { sort_desc: "blockNumber", limit: opts.limit ?? 100 }
    );
    return rows;
  }
}

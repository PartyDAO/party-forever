import type { APICrowdfund, APIParty } from "@party-forever/externals";

import { NETWORK_ID_TO_NAME } from "@/lib/constants.ts";
import { getDbPartyProtocolClient } from "@/lib/db_party_protocol_client.ts";

export interface SearchResult {
  key: string;
  name: string;
  networkName: string;
  partyAddress: string | null;
  crowdfundAddress: string | null;
}

/**
 * Merges party and crowdfund search results into a single deduplicated list.
 *
 * Parties are indexed first by `{networkId}-{address}`. Crowdfunds are then
 * folded in by resolving each crowdfund's linked party address — first from
 * `ethCrowdfund_party` on the crowdfund record itself, then falling back to
 * `crowdfundToParty` (a map derived from `CrowdfundStatusUpdate` rows, which
 * covers older GENESIS-era crowdfunds that lack `ethCrowdfund_party`).
 *
 * When a crowdfund resolves to a party already in the map, the crowdfund
 * address is attached to that existing entry (no duplicate row). Crowdfunds
 * that don't match any party entry are added as standalone rows.
 *
 * The result is a flat list where each item may have a party link, a crowdfund
 * link, or both — but never two rows for the same party/crowdfund pair.
 */
export const dedupePartyAndCrowdfundResults = (
  parties: APIParty[],
  crowdfunds: APICrowdfund[],
  crowdfundToParty: Map<string, string>
): SearchResult[] => {
  const resultMap = new Map<string, SearchResult>();

  for (const party of parties) {
    const networkName = NETWORK_ID_TO_NAME[party.networkId];
    if (!networkName) continue;
    const key = `${party.networkId}-${party.address.toLowerCase()}`;
    resultMap.set(key, {
      key,
      name: party.opts_name || "Unnamed",
      networkName,
      partyAddress: party.address,
      crowdfundAddress: null
    });
  }

  for (const cf of crowdfunds) {
    const networkName = NETWORK_ID_TO_NAME[cf.networkId];
    if (!networkName) continue;

    // Resolve the linked party: prefer the crowdfund's own field, fall back
    // to the status-update-derived map for older crowdfunds.
    const linkedParty =
      cf.ethCrowdfund_party?.toLowerCase() ??
      crowdfundToParty.get(cf.crowdfundAddress)?.toLowerCase() ??
      null;

    // Skip if the "crowdfund" address is actually the linked party (bad data).
    if (linkedParty && cf.crowdfundAddress.toLowerCase() === linkedParty) continue;

    // If the crowdfund links to a party already in the map, attach the
    // crowdfund address to the existing entry instead of creating a new row.
    if (linkedParty) {
      const partyKey = `${cf.networkId}-${linkedParty}`;
      const existing = resultMap.get(partyKey);
      if (existing) {
        existing.crowdfundAddress = cf.crowdfundAddress;
        continue;
      }
    }

    // Standalone crowdfund (may still reference a party we didn't find by name).
    const cfKey = `${cf.networkId}-cf-${cf.crowdfundAddress.toLowerCase()}`;
    resultMap.set(cfKey, {
      key: cfKey,
      name: cf.opts_name || "Unnamed",
      networkName,
      partyAddress: linkedParty,
      crowdfundAddress: cf.crowdfundAddress
    });
  }

  return [...resultMap.values()];
};

/**
 * Searches parties and crowdfunds by name, resolves crowdfund→party links
 * (including GENESIS-era crowdfunds via CrowdfundStatusUpdate), and returns
 * a deduplicated list of results.
 */
export const searchByName = async (name: string, limit: number): Promise<SearchResult[]> => {
  const [parties, crowdfunds] = await Promise.all([
    getDbPartyProtocolClient().searchParties(name, { limit }),
    getDbPartyProtocolClient().searchCrowdfunds(name, { limit })
  ]);

  // Resolve crowdfund→party links via CrowdfundStatusUpdate for crowdfunds
  // that lack an ethCrowdfund_party field (e.g. GENESIS-era crowdfunds).
  const needsLookup = crowdfunds
    .filter((cf) => !cf.ethCrowdfund_party)
    .map((cf) => cf.crowdfundAddress);
  const crowdfundToParty =
    await getDbPartyProtocolClient().getPartyAddressesForCrowdfunds(needsLookup);

  return dedupePartyAndCrowdfundResults(parties, crowdfunds, crowdfundToParty);
};

import type { NetworkName } from "@party-forever/contracts";

const OPENSEA_API_BASE = "https://api.opensea.io";

const OPENSEA_API_CHAIN_NAME: Record<NetworkName, string> = {
  mainnet: "ethereum",
  base: "base",
  zora: "zora"
};

export interface OpenseaFee {
  recipientAddress: `0x${string}`;
  feeBasisPoints: number;
}

/**
 * Fetches OpenSea marketplace + creator fees for the collection that a given NFT belongs to.
 * Returns an array of { recipientAddress, feeBasisPoints } with zero-value fees filtered out.
 *
 * The OpenSea collection API returns fees as `{ fee: number (percentage e.g. 2.5), recipient: string, required: boolean }`.
 * We convert the percentage to basis points (multiply by 100).
 */
export const fetchOpenseaCollectionFees = async (
  network: NetworkName,
  contractAddress: string,
  tokenId: string
): Promise<OpenseaFee[]> => {
  const chain = OPENSEA_API_CHAIN_NAME[network];

  // Step 1: Get the collection slug from the NFT
  const nftResp = await fetch(
    `${OPENSEA_API_BASE}/api/v2/chain/${chain}/contract/${contractAddress}/nfts/${tokenId}`,
    { headers: openseaHeaders() }
  );
  if (!nftResp.ok) {
    throw new Error(`Failed to fetch NFT info from OpenSea (${nftResp.status})`);
  }
  const nftData = (await nftResp.json()) as { nft?: { collection: string } };
  const collectionSlug = nftData?.nft?.collection;
  if (!collectionSlug) {
    throw new Error("Could not determine OpenSea collection for this NFT");
  }

  // Step 2: Fetch collection info (includes fees)
  const collectionResp = await fetch(`${OPENSEA_API_BASE}/api/v2/collections/${collectionSlug}`, {
    headers: openseaHeaders()
  });
  if (!collectionResp.ok) {
    throw new Error(`Failed to fetch collection info from OpenSea (${collectionResp.status})`);
  }
  const collectionData = (await collectionResp.json()) as {
    fees?: Array<{ fee: number; recipient: string; required: boolean }>;
  };

  if (!collectionData.fees || collectionData.fees.length === 0) {
    return [];
  }

  // Convert percentage-based fees to basis points and filter out zeros
  return collectionData.fees
    .map((f) => ({
      recipientAddress: f.recipient as `0x${string}`,
      feeBasisPoints: Math.round(f.fee * 100)
    }))
    .filter((f) => f.feeBasisPoints > 0);
};

/**
 * Given a list price in wei and an array of fees in basis points,
 * computes the fee amounts in wei and the adjusted list price (listPrice - totalFees).
 */
export const computeSeaportFees = (
  listPriceWei: bigint,
  fees: OpenseaFee[]
): {
  adjustedListPrice: bigint;
  feeAmounts: bigint[];
  feeRecipients: `0x${string}`[];
} => {
  const feeAmounts = fees.map((f) => (listPriceWei * BigInt(f.feeBasisPoints)) / 10000n);
  const feeRecipients = fees.map((f) => f.recipientAddress);
  const totalFees = feeAmounts.reduce((sum, amt) => sum + amt, 0n);
  const adjustedListPrice = listPriceWei - totalFees;

  if (adjustedListPrice <= 0n) {
    throw new Error("List price is too low to cover fees");
  }

  return { adjustedListPrice, feeAmounts, feeRecipients };
};

function openseaHeaders(): Record<string, string> {
  const apiKey = import.meta.env.VITE_OPENSEA_API_KEY;
  if (apiKey) {
    return { "X-API-KEY": apiKey };
  }
  return {};
}

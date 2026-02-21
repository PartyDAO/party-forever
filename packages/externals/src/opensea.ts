import type { NetworkName } from "@party-forever/contracts";

import type { Alchemy_NftV3 } from "./types.ts";

export const OPENSEA_URL_PREFIX = "https://opensea.io";

const OPENSEA_CHAIN_NAME: Record<NetworkName, string> = {
  base: "base",
  mainnet: "ethereum",
  zora: "zora"
};

export const getOpenseaAssetUrl = (
  network: NetworkName,
  contractAddress: string,
  tokenId: string
): string =>
  `${OPENSEA_URL_PREFIX}/assets/${OPENSEA_CHAIN_NAME[network]}/${contractAddress}/${tokenId}`;

/** OpenSea collection page URL (no specific token). */
export const getOpenseaCollectionUrl = (network: NetworkName, contractAddress: string): string =>
  `${OPENSEA_URL_PREFIX}/assets/${OPENSEA_CHAIN_NAME[network]}/${contractAddress}`;

export const getFloorPrice = (nft: Alchemy_NftV3): number => {
  return nft.contract?.openSeaMetadata?.floorPrice ?? 0;
};

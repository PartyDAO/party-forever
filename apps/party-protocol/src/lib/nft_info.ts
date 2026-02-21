import type { NetworkName } from "@party-forever/contracts";
import { ERC721 } from "@party-forever/contracts";

import { getClient } from "@/lib/client.ts";
import { toDisplayableImageUrl } from "@/lib/utils.ts";

export interface DecodedNftInfo {
  name: string;
  symbol: string;
  imageUrl: string | null;
}

export async function fetchNftInfo(
  network: NetworkName,
  tokenAddress: `0x${string}`,
  tokenId: bigint
): Promise<DecodedNftInfo> {
  const client = getClient(network);
  const erc721 = new ERC721(network, tokenAddress, client);

  const [name, symbol] = await Promise.all([erc721.fetchName(), erc721.fetchSymbol()]);

  let imageUrl: string | null = null;
  try {
    const tokenURI = await erc721.fetchTokenURI(tokenId);
    const resolvedUri = toDisplayableImageUrl(tokenURI);

    if (resolvedUri.startsWith("data:application/json")) {
      const json = JSON.parse(resolvedUri.split(",")[1]);
      imageUrl = json.image ? toDisplayableImageUrl(json.image) : null;
    } else {
      const resp = await fetch(resolvedUri);
      const json = await resp.json();
      imageUrl = json.image ? toDisplayableImageUrl(json.image) : null;
    }
  } catch {
    // tokenURI may not be available for all NFTs
  }

  return { name, symbol, imageUrl };
}

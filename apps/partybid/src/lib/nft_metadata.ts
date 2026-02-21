import { type Client, ERC721 } from "@party-forever/contracts";
import { resolveIpfsUrl } from "@party-forever/ui";

export interface NftMetadata {
  name: string;
  imageUrl: string | null;
}

/**
 * Fetches NFT name and image using RPC only: tokenURI(tokenId) then fetch metadata JSON.
 */
export async function fetchNftMetadata(
  nftContract: `0x${string}`,
  tokenId: bigint,
  client: Client
): Promise<NftMetadata> {
  const erc721 = new ERC721("mainnet", nftContract, client);
  let name = "";
  let imageUrl: string | null = null;

  try {
    const tokenURI = await erc721.fetchTokenURI(tokenId);
    const resolvedUri = resolveIpfsUrl(tokenURI);

    // tokenURI can point directly to an image (data:image/... or some gateways)
    if (
      resolvedUri.startsWith("data:image/") ||
      /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(resolvedUri)
    ) {
      imageUrl = resolvedUri;
    }

    let json: { name?: string; image?: string; image_url?: string };
    if (resolvedUri.startsWith("data:application/json")) {
      const base64 = resolvedUri.split(",")[1];
      if (base64) {
        json = JSON.parse(atob(base64)) as typeof json;
      } else {
        json = {};
      }
    } else if (!imageUrl) {
      const resp = await fetch(resolvedUri);
      json = (await resp.json()) as typeof json;
    } else {
      json = {};
    }

    name = json.name ?? "";
    const rawImage = json.image ?? json.image_url ?? null;
    if (rawImage) {
      const resolved = resolveIpfsUrl(rawImage);
      if (
        (resolved.startsWith("/") ||
          (!resolved.startsWith("http") && !resolved.startsWith("data:"))) &&
        !resolvedUri.startsWith("data:")
      ) {
        try {
          imageUrl = new URL(resolved, resolvedUri).href;
        } catch {
          imageUrl = resolved;
        }
      } else {
        imageUrl = resolved;
      }
    }
  } catch {
    // tokenURI or metadata fetch may fail
  }

  return { name, imageUrl };
}

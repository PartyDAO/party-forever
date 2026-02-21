import type { Client } from "@party-forever/contracts";
import { useQuery } from "@tanstack/react-query";

import { getClient } from "@/lib/client.ts";
import { fetchNftMetadata } from "@/lib/nft_metadata.ts";

interface NFTImageProps {
  nftContract: `0x${string}`;
  tokenId: bigint;
}

export const NFTImage = ({ nftContract, tokenId }: NFTImageProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["nftMetadata", nftContract, tokenId.toString()],
    queryFn: () => fetchNftMetadata(nftContract, tokenId, getClient() as Client)
  });

  const imageUrl = data?.imageUrl ?? null;

  if (isLoading) {
    return <div className="aspect-square w-32 shrink-0 animate-pulse rounded-lg bg-muted" />;
  }

  if (!imageUrl) {
    return null;
  }
  return (
    <div className="aspect-square w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
      <img src={imageUrl} alt="NFT Image" className="size-full object-cover" />
    </div>
  );
};

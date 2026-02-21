import type { NetworkName } from "@party-forever/contracts";
import { ProposalType } from "@party-forever/contracts";
import { useQuery } from "@tanstack/react-query";
import { formatDuration, formatEth } from "@/lib/format.ts";
import { fetchNftInfo } from "@/lib/nft_info.ts";

interface StandardListingData {
  proposalType: typeof ProposalType.ListOnOpensea;
  token: `0x${string}`;
  tokenId: bigint;
  listPrice: bigint;
  duration: number;
}

interface AdvancedListingData {
  proposalType: typeof ProposalType.ListOnOpenseaAdvanced;
  token: `0x${string}`;
  tokenId: bigint;
  startPrice: bigint;
  endPrice: bigint;
  duration: number;
}

type OpenseaListingData = StandardListingData | AdvancedListingData;

interface OpenseaListingDisplayProps {
  data: OpenseaListingData;
  network: NetworkName;
}

export const OpenseaListingDisplay = ({ data, network }: OpenseaListingDisplayProps) => {
  const { data: nftInfo } = useQuery({
    queryKey: ["nftInfo", network, data.token, data.tokenId.toString()],
    queryFn: () => fetchNftInfo(network, data.token, data.tokenId)
  });

  const listPrice =
    data.proposalType === ProposalType.ListOnOpensea ? data.listPrice : data.startPrice;
  const displayName = nftInfo
    ? `${nftInfo.symbol} #${data.tokenId.toString()}`
    : `#${data.tokenId.toString()}`;
  const collectionName = nftInfo ? `${nftInfo.name}` : "—";

  return (
    <div className="rounded-lg bg-muted/60 p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {nftInfo?.imageUrl ? (
            <img
              src={nftInfo.imageUrl}
              alt=""
              className="size-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
              NFT
            </div>
          )}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-semibold text-foreground truncate">{displayName}</span>
          <span className="text-sm text-muted-foreground truncate">{collectionName}</span>
        </div>
      </div>
      <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground">List Price</div>
          <div className="font-semibold">{formatEth(listPrice)} ETH</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Listing Expires After</div>
          <div className="font-semibold">{formatDuration(data.duration)}</div>
        </div>
      </div>
    </div>
  );
};

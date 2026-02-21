import type { NetworkName } from "@party-forever/contracts";

import { Button } from "@party-forever/ui";
import type { Alchemy_NftV3 } from "@/external/alchemy";
import { getFloorPrice, getOpenseaAssetUrl } from "@/lib/opensea.ts";

function getNftImageUrl(nft: Alchemy_NftV3): string | null {
  return nft.image?.thumbnailUrl ?? nft.image?.cachedUrl ?? nft.image?.pngUrl ?? null;
}

interface NFTImageProps {
  nft: Alchemy_NftV3;
  network: NetworkName;
  partyAddress?: `0x${string}`;
  isMember?: boolean;
  onOpenSendNftDialog?: (nftContractAddress: string, nftTokenId: string) => void;
  onOpenOpenseaSaleDialog?: (nftContractAddress: string, nftTokenId: string) => void;
  isNftParty?: boolean;
}

export const NFTImage = ({
  nft,
  network,
  partyAddress,
  isMember,
  onOpenSendNftDialog,
  onOpenOpenseaSaleDialog,
  isNftParty
}: NFTImageProps) => {
  const imageUrl = getNftImageUrl(nft);
  const name = nft.name ?? nft.contract?.name ?? "—";
  const url = getOpenseaAssetUrl(network, nft.contract.address, nft.tokenId);
  const floorPrice = getFloorPrice(nft);
  const showSellButton = isMember && partyAddress && onOpenOpenseaSaleDialog && isNftParty;
  const showSendButton = isMember && partyAddress && onOpenSendNftDialog;

  return (
    <div className="flex flex-col gap-1 rounded-lg border p-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col gap-1 transition-colors hover:opacity-90"
      >
        <div className="aspect-square w-full overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
        <span className="line-clamp-2 text-center text-sm" title={`${name} #${nft.tokenId}`}>
          {name}
        </span>
        {floorPrice > 0 && (
          <span className="text-muted-foreground text-center text-xs">
            Floor: {floorPrice.toLocaleString(undefined, { maximumFractionDigits: 5 })} ETH
          </span>
        )}
      </a>
      {showSellButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            onOpenOpenseaSaleDialog(nft.contract.address, nft.tokenId);
          }}
        >
          Sell on OpenSea
        </Button>
      )}
      {showSendButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.preventDefault();
            onOpenSendNftDialog(nft.contract.address, nft.tokenId);
          }}
        >
          Send NFT
        </Button>
      )}
    </div>
  );
};

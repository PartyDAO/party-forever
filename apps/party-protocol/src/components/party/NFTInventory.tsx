import type { NetworkName } from "@party-forever/contracts";

import { NFTImage } from "@/components/party/NFTImage";
import type { Alchemy_NftV3 } from "@/external/alchemy";
import { getFloorPrice } from "@/lib/opensea.ts";

function isSpamNft(nft: Alchemy_NftV3): boolean {
  const name = (nft.name ?? nft.contract?.name ?? "").toLowerCase();
  return name.includes("claim");
}

interface NFTInventoryProps {
  nfts: Alchemy_NftV3[];
  network: NetworkName;
  partyAddress?: `0x${string}`;
  isMember?: boolean;
  onOpenSendNftDialog?: (nftContractAddress: string, nftTokenId: string) => void;
  onOpenOpenseaSaleDialog?: (nftContractAddress: string, nftTokenId: string) => void;
  isNftParty?: boolean;
}

export const NFTInventory = ({
  nfts,
  network,
  partyAddress,
  isMember,
  onOpenSendNftDialog,
  onOpenOpenseaSaleDialog,
  isNftParty
}: NFTInventoryProps) => {
  if (nfts.length === 0) {
    return <p className="text-muted-foreground text-sm">No NFTs found for this party.</p>;
  }
  const sorted = [...nfts].sort((a, b) => {
    const spamA = isSpamNft(a) ? 1 : 0;
    const spamB = isSpamNft(b) ? 1 : 0;
    if (spamA !== spamB) return spamA - spamB;
    return getFloorPrice(b) - getFloorPrice(a);
  });
  return (
    <div>
      <h3 className="text-muted-foreground mb-2 text-sm font-medium">NFTs</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {sorted.map((nft) => (
          <div
            key={`${nft.contract.address}-${nft.tokenId}`}
            className={isSpamNft(nft) ? "opacity-50" : undefined}
          >
            <NFTImage
              nft={nft}
              network={network}
              partyAddress={partyAddress}
              isMember={isMember}
              onOpenSendNftDialog={onOpenSendNftDialog}
              onOpenOpenseaSaleDialog={onOpenOpenseaSaleDialog}
              isNftParty={isNftParty}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

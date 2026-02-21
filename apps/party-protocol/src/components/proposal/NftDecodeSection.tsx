import type { NetworkName } from "@party-forever/contracts";
import { useState } from "react";

import { Button } from "@party-forever/ui";
import { type DecodedNftInfo, fetchNftInfo } from "@/lib/nft_info.ts";

interface NftDecodeSectionProps {
  network: NetworkName;
  token: `0x${string}`;
  tokenId: bigint;
}

export const NftDecodeSection = ({ network, token, tokenId }: NftDecodeSectionProps) => {
  const [decoded, setDecoded] = useState<DecodedNftInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await fetchNftInfo(network, token, tokenId);
      setDecoded(info);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch NFT info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!decoded && (
        <div className="pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecode}
            disabled={loading}
          >
            {loading ? "Loading…" : "Decode"}
          </Button>
        </div>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
      {decoded && (
        <div className="mt-2 p-3 bg-background border rounded flex gap-3 items-start">
          {decoded.imageUrl && (
            <div className="w-20 h-20 shrink-0 overflow-hidden rounded-md bg-muted">
              <img
                src={decoded.imageUrl}
                alt=""
                className="size-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex flex-col gap-0.5 text-sm">
            <div>
              <span className="text-muted-foreground">Collection: </span>
              <span className="font-medium">
                {decoded.name} ({decoded.symbol})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Token ID: </span>
              <span className="font-mono">{tokenId.toString()}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

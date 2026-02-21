import type { NetworkName } from "@party-forever/contracts";
import { ERC20, ETH_SENTINEL_ADDRESS } from "@party-forever/contracts";
import { useState } from "react";

import { Button } from "@party-forever/ui";
import { formatEth, formatTokenAmount } from "@/lib/format.ts";
import { getClient } from "@/lib/client.ts";

type DecodedTokenInfo =
  | { tokenType: 0; name: string; symbol: string; decimals: number; formattedAmount: string }
  | { tokenType: 1; name: string; symbol: string; decimals: number; formattedAmount: string };

interface DistributionProposalDisplayProps {
  amount: bigint;
  tokenType: number;
  token: string;
  network: NetworkName;
}

export const DistributionProposalDisplay = ({
  amount,
  tokenType,
  token,
  network
}: DistributionProposalDisplayProps) => {
  const [decoded, setDecoded] = useState<DecodedTokenInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async () => {
    setLoading(true);
    setError(null);
    try {
      if (tokenType === 0) {
        setDecoded({
          tokenType: 0,
          name: "Ether",
          symbol: "ETH",
          decimals: 18,
          formattedAmount: formatEth(amount)
        });
        return;
      }
      if (tokenType === 1 && token.toLowerCase() !== ETH_SENTINEL_ADDRESS.toLowerCase()) {
        const client = getClient(network);
        const erc20 = new ERC20(network, token as `0x${string}`, client);
        const [{ name, symbol }, decimals] = await Promise.all([
          erc20.fetchNameAndSymbol(),
          erc20.fetchDecimals()
        ]);
        setDecoded({
          tokenType: 1,
          name,
          symbol,
          decimals,
          formattedAmount: formatTokenAmount(amount, decimals)
        });
        return;
      }
      setError("Unknown token type or address");
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
        <div>Amount: {amount.toString()}</div>
        <div>Token Type: {tokenType === 0 ? "ETH" : tokenType === 1 ? "ERC20" : tokenType}</div>
        <div>Token Address: {token}</div>
      </pre>
      {!decoded && (
        <div className="w-fit">
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
        <div className="bg-muted rounded p-3 flex flex-col gap-1 text-sm font-medium">
          <div>
            <span className="text-muted-foreground">Token: </span>
            {decoded.name} ({decoded.symbol})
          </div>
          <div>
            <span className="text-muted-foreground">Decimals: </span>
            {decoded.decimals}
          </div>
          <div>
            <span className="text-muted-foreground">Amount: </span>
            {decoded.formattedAmount} {decoded.symbol}
          </div>
        </div>
      )}
    </div>
  );
};

import type { NetworkName } from "@party-forever/contracts";
import { formatUnits } from "viem";

import { Button } from "@party-forever/ui";
import { EtherscanLink } from "@/components/ui/EtherscanLink.tsx";
import type { TokenWithMetadata } from "@/external/alchemy";
import { formatEth, formatTokenAmount } from "@/lib/format.ts";

export function isSpamToken(t: TokenWithMetadata): boolean {
  const name = (t.name ?? "").toLowerCase();
  const symbol = (t.symbol ?? "").toLowerCase();
  return name.includes("claim") || symbol.includes("claim");
}

interface TokenInventoryProps {
  tokens: TokenWithMetadata[];
  ethBalance?: bigint;
  network: NetworkName;
  onOpenSendTokenDialog?: (tokenAddress: string, decimals: number) => void;
  onOpenDistributionDialog?: (tokenAddress?: string, amount?: string) => void;
}

export const TokenInventory = ({
  tokens,
  ethBalance,
  network,
  onOpenSendTokenDialog,
  onOpenDistributionDialog
}: TokenInventoryProps) => {
  const hasEth = ethBalance !== undefined && ethBalance > 0n;
  if (tokens.length === 0 && !hasEth) {
    return <p className="text-muted-foreground text-sm">No token balances found for this party.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4">Token</th>
            <th className="pb-2 pr-4">Balance</th>
            <th className="pb-2 pr-4">Contract</th>
            {(onOpenSendTokenDialog || onOpenDistributionDialog) && (
              <th className="pb-2">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {hasEth && (
            <tr key="eth" className="border-b">
              <td className="py-2 pr-4">
                <div className="flex items-center gap-2">
                  <div className="size-6 shrink-0 rounded-full bg-[#627EEA]" title="ETH" />
                  <span>ETH</span>
                </div>
              </td>
              <td className="py-2 pr-4 font-mono">{formatEth(ethBalance)}</td>
              <td className="py-2 pr-4 text-muted-foreground">Native</td>
              {(onOpenSendTokenDialog || onOpenDistributionDialog) && (
                <td className="py-2">
                  <div className="flex gap-1">
                    {onOpenDistributionDialog && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenDistributionDialog(undefined, formatUnits(ethBalance, 18));
                        }}
                      >
                        Distribute
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          )}
          {tokens.map((t) => {
            const isSpam = isSpamToken(t);
            return (
              <tr
                key={t.contractAddress}
                className={`border-b ${isSpam ? "text-muted-foreground opacity-70" : ""}`}
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    {t.logo && (
                      <img src={t.logo} alt="" className="size-6 rounded-full object-cover" />
                    )}
                    <span>
                      {t.symbol || t.name || "—"}
                      {t.name && t.symbol && t.name !== t.symbol && (
                        <span className="text-muted-foreground ml-1">({t.name})</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-4 font-mono">
                  {formatTokenAmount(BigInt(t.tokenBalance), t.decimals)}
                </td>
                <td className="py-2 pr-4">
                  <EtherscanLink
                    network={network}
                    address={t.contractAddress}
                    addressType="token"
                  />
                </td>
                {(onOpenSendTokenDialog || onOpenDistributionDialog) && (
                  <td className="py-2">
                    <div className="flex gap-1">
                      {onOpenSendTokenDialog && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenSendTokenDialog(t.contractAddress, t.decimals)}
                        >
                          Send Token
                        </Button>
                      )}
                      {onOpenDistributionDialog && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onOpenDistributionDialog(
                              t.contractAddress,
                              formatUnits(BigInt(t.tokenBalance), t.decimals)
                            );
                          }}
                        >
                          Distribute
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

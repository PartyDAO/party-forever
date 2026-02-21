import { useContext, useEffect } from "react";

import type { NetworkName } from "@party-forever/contracts";

import { EnsContext, ExternalLinkIcon } from "@party-forever/ui";

interface EtherscanLinkProps {
  network: NetworkName;
  address: string;
  addressType: "address" | "tx" | "token";
  text?: string;
  hash?: string;
}

function getExplorerUrl(
  network: NetworkName,
  address: string,
  addressType: "address" | "tx" | "token",
  hash?: string
): string {
  const baseUrls: Record<NetworkName, string> = {
    mainnet: "https://etherscan.io",
    base: "https://basescan.org",
    zora: "https://explorer.zora.energy"
  };
  const base = `${baseUrls[network]}/${addressType}/${address}`;
  return hash ? `${base}#${hash}` : base;
}

export const EtherscanLink = ({
  network,
  address,
  addressType,
  text,
  hash
}: EtherscanLinkProps) => {
  const ensCtx = useContext(EnsContext);
  const shouldResolve = addressType === "address";

  useEffect(() => {
    if (shouldResolve && ensCtx) {
      ensCtx.registerAddress(address);
    }
  }, [address, shouldResolve, ensCtx]);

  const ensName = shouldResolve ? ensCtx?.ensNames.get(address.toLowerCase()) : undefined;
  const url = getExplorerUrl(network, address, addressType, hash);
  const defaultDisplay = addressType === "tx" ? address.slice(0, 10) : address;
  const displayText = text ?? ensName ?? defaultDisplay;

  return (
    <span className="inline-flex items-center gap-1 font-mono" title={address}>
      {displayText}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer hover:opacity-70 text-[#00d4ff]"
        title="View on block explorer"
      >
        <ExternalLinkIcon />
      </a>
    </span>
  );
};

import type { TokenPageNetwork } from "@/lib/constants.ts";

import { ExternalLinkIcon } from "@party-forever/ui";

interface EtherscanLinkProps {
  network: TokenPageNetwork;
  address: string;
  addressType: "address" | "tx" | "token";
  text?: string;
}

const getExplorerUrl = (
  _network: TokenPageNetwork,
  address: string,
  addressType: "address" | "tx" | "token"
): string => {
  return `https://basescan.org/${addressType}/${address}`;
};

export const EtherscanLink = ({ network, address, addressType, text }: EtherscanLinkProps) => {
  const url = getExplorerUrl(network, address, addressType);
  const displayText = text ?? (addressType === "tx" ? `${address.slice(0, 10)}…` : address);

  return (
    <span className="inline-flex items-center gap-1 font-mono">
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

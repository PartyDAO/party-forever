import { useContext, useEffect } from "react";

import { EnsContext, ExternalLinkIcon } from "@party-forever/ui";

interface EtherscanLinkProps {
  address: string;
  type?: "address" | "tx";
  truncate?: number;
}

export const EtherscanLink = ({ address, type = "address", truncate }: EtherscanLinkProps) => {
  const ensCtx = useContext(EnsContext);
  const shouldResolve = type === "address";

  useEffect(() => {
    if (shouldResolve && ensCtx) {
      ensCtx.registerAddress(address);
    }
  }, [address, shouldResolve, ensCtx]);

  const ensName = shouldResolve ? ensCtx?.ensNames.get(address.toLowerCase()) : undefined;
  const url = `https://etherscan.io/${type}/${address}`;
  const fullText = ensName ?? address;
  const displayText = truncate ? fullText.slice(0, truncate) : fullText;

  return (
    <span className="inline-flex items-center gap-1 font-mono" title={address}>
      {displayText}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer hover:opacity-70 text-[#00d4ff]"
        title="View on Etherscan"
      >
        <ExternalLinkIcon />
      </a>
    </span>
  );
};

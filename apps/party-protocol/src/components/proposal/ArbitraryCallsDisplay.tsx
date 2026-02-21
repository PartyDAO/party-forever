import type { ArbitraryCall, NetworkName } from "@party-forever/contracts";
import { useState } from "react";
import { formatEther } from "viem";

import {
  decodeCalldata,
  type DecodedCalldata,
  extractSelector,
  formatDecodedValue,
  lookupFunctionSelector
} from "@/external/sourcify.ts";

import { EtherscanLink } from "../ui/EtherscanLink.tsx";

interface ArbitraryCallsDisplayProps {
  calls: readonly ArbitraryCall[];
  network: NetworkName;
}

interface SingleCallDisplayProps {
  call: ArbitraryCall;
  index: number;
  network: NetworkName;
}

interface DecodeResult {
  decoded: DecodedCalldata;
  otherSignatures: number;
}

interface EthTransferDisplayProps {
  value: bigint;
  target: `0x${string}`;
  network: NetworkName;
}

const EthTransferDisplay = ({ value, target, network }: EthTransferDisplayProps) => {
  return (
    <div className="text-sm">
      Transfer {formatEther(value)} ETH to{" "}
      <EtherscanLink network={network} address={target} addressType="address" />
    </div>
  );
};

const SingleCallDisplay = ({ call, index, network }: SingleCallDisplayProps) => {
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeLoading, setDecodeLoading] = useState(false);
  const [decodeAttempted, setDecodeAttempted] = useState(false);

  async function handleDecode() {
    const selector = extractSelector(call.data);
    if (!selector) {
      setDecodeError("Data too short to extract selector");
      setDecodeAttempted(true);
      return;
    }

    setDecodeLoading(true);
    setDecodeError(null);
    try {
      const signatures = await lookupFunctionSelector(selector);
      if (!signatures || signatures.length === 0) {
        setDecodeError("No matching function signature found");
        return;
      }

      const decoded = decodeCalldata(signatures[0].name, call.data);
      setDecodeResult({
        decoded,
        otherSignatures: signatures.length - 1
      });
    } catch (e) {
      setDecodeError(e instanceof Error ? e.message : "Failed to decode calldata");
    } finally {
      setDecodeLoading(false);
      setDecodeAttempted(true);
    }
  }

  function formatDecodedCall(decoded: DecodedCalldata): string {
    const formattedArgs = decoded.args.map(formatDecodedValue).join(", ");
    return `${decoded.functionName}(${formattedArgs})`;
  }

  const isEthTransfer = call.data === "0x" && call.value > 0n;

  if (isEthTransfer) {
    return (
      <div className="text-xs bg-muted p-3 rounded space-y-2">
        <div className="font-medium">Call {index + 1}</div>
        <EthTransferDisplay value={call.value} target={call.target} network={network} />
      </div>
    );
  }

  return (
    <div className="text-xs bg-muted p-3 rounded space-y-2">
      <div className="font-medium">Call {index + 1}</div>
      <div>
        <span className="text-muted-foreground">Value: </span>
        <span className="font-mono">{call.value.toString()}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Optional: </span>
        <span>{call.optional ? "Yes" : "No"}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Expected Result Hash: </span>
        <span className="font-mono break-all">{call.expectedResultHash}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Target: </span>
        <EtherscanLink network={network} address={call.target} addressType="address" />
      </div>
      <div>
        <span className="text-muted-foreground">Data: </span>
        <pre className="mt-1 p-2 bg-background rounded overflow-x-auto font-mono">{call.data}</pre>
        {!decodeAttempted && (
          <button
            type="button"
            onClick={handleDecode}
            disabled={decodeLoading}
            className="mt-2 px-2 py-1 text-xs bg-background border rounded hover:bg-accent disabled:opacity-50"
          >
            {decodeLoading ? "Decoding..." : "Decode"}
          </button>
        )}
        {decodeAttempted && decodeResult && (
          <div className="mt-2 p-2 bg-background border rounded">
            <span className="font-mono break-all">{formatDecodedCall(decodeResult.decoded)}</span>
            {decodeResult.otherSignatures > 0 && (
              <span className="text-muted-foreground ml-1">
                (+{decodeResult.otherSignatures} other signature
                {decodeResult.otherSignatures > 1 ? "s" : ""})
              </span>
            )}
          </div>
        )}
        {decodeAttempted && decodeError && (
          <div className="mt-2 p-2 bg-background border rounded text-destructive">
            {decodeError}
          </div>
        )}
      </div>
    </div>
  );
};

export const ArbitraryCallsDisplay = ({ calls, network }: ArbitraryCallsDisplayProps) => {
  return (
    <div className="space-y-3">
      {calls.map((call, index) => (
        <SingleCallDisplay
          key={`${call.target}-${index}`}
          call={call}
          index={index}
          network={network}
        />
      ))}
    </div>
  );
};

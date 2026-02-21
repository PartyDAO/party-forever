import { decodeFunctionData, parseAbiItem } from "viem";

export interface SourcifySignature {
  name: string;
  filtered: boolean;
  hasVerifiedContract: boolean;
}

export interface SourcifyLookupResponse {
  ok: boolean;
  result: {
    function: Record<string, SourcifySignature[]>;
    event: Record<string, SourcifySignature[]>;
  };
}

export async function lookupFunctionSelector(
  selector: `0x${string}`
): Promise<SourcifySignature[] | null> {
  const url = `https://api.4byte.sourcify.dev/signature-database/v1/lookup?function=${selector}&filter=true`;
  const response = await fetch(url);
  const data: SourcifyLookupResponse = await response.json();

  if (!data.ok) {
    return null;
  }

  const signatures = data.result.function[selector];
  return signatures && signatures.length > 0 ? signatures : null;
}

export function extractSelector(data: `0x${string}`): `0x${string}` | null {
  if (data.length < 10) {
    return null;
  }
  return data.slice(0, 10) as `0x${string}`;
}

export interface DecodedCalldata {
  functionName: string;
  args: readonly unknown[];
}

export function decodeCalldata(signature: string, data: `0x${string}`): DecodedCalldata {
  const abiItem = parseAbiItem(`function ${signature}`);
  const decoded = decodeFunctionData({ abi: [abiItem], data });
  return {
    functionName: decoded.functionName,
    args: decoded.args ?? []
  };
}

export function formatDecodedValue(value: unknown): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatDecodedValue).join(", ")}]`;
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string") {
    return value;
  }
  return String(value);
}

import type { NetworkName } from "@party-forever/contracts";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { resolveIpfsUrl } from "@party-forever/ui";
import { DATA_URI_JSON_BASE64_PREFIX } from "./constants.ts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toDisplayableImageUrl(url: string): string {
  return resolveIpfsUrl(url);
}

/**
 * Parses a contract URI (e.g. from contractURI()) and returns the image URL for display.
 * Uses the "image" field from the JSON (e.g. ipfs://...); converts ipfs:// to a gateway URL.
 * Supports: data:application/json;base64,... or a plain http(s) URL returned as-is.
 */
export function getImageUrlFromContractUri(contractUri: string): string | null {
  if (contractUri.startsWith("http://") || contractUri.startsWith("https://")) {
    return contractUri;
  }
  if (!contractUri.startsWith(DATA_URI_JSON_BASE64_PREFIX)) {
    return null;
  }
  try {
    const base64 = contractUri.slice(DATA_URI_JSON_BASE64_PREFIX.length);
    const jsonString = atob(base64);
    const parsed = JSON.parse(jsonString) as { image?: string; external_url?: string };
    const raw = parsed.image ?? parsed.external_url ?? null;
    return raw ? toDisplayableImageUrl(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Sort hex addresses alphanumerically (lowercase comparison).
 * The Party rageQuit() contract expects withdraw token addresses in sorted order.
 */
export function sortAddresses(addresses: `0x${string}`[]): `0x${string}`[] {
  return [...addresses].sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
}

export const getPartyAppLink = (network: NetworkName, partyAddress: `0x${string}`): string => {
  if (network === "mainnet") {
    return `https://party.app/party/${partyAddress}`;
  }
  return `https://${network}.party.app/party/${partyAddress}`;
};

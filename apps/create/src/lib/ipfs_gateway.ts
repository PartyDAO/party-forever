import { IPFS_GATEWAY } from "./constants.ts";

const STORAGE_KEY = "create_ipfs_gateway";

/** Format: https://host/path ending in /ipfs (e.g. https://ipfs-node.fly.dev/ipfs). */
const IPFS_GATEWAY_URL_REGEX = /^https:\/\/.+\/ipfs\/?$/i;

export const DEFAULT_IPFS_GATEWAY = IPFS_GATEWAY;

export function getIpfsGatewayFromStorage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.trim()) return stored.trim();
  } catch {
    // ignore
  }
  return DEFAULT_IPFS_GATEWAY;
}

export function setIpfsGatewayInStorage(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.trim());
}

export function clearIpfsGatewayInStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isValidIpfsGatewayUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return IPFS_GATEWAY_URL_REGEX.test(trimmed.endsWith("/") ? trimmed : trimmed + "/");
}

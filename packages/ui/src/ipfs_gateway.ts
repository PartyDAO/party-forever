const STORAGE_KEY = "party-forever-ipfs-gateway";
const IPFS_GATEWAY_URL_REGEX = /^https:\/\/.+\/ipfs\/?$/i;

export const DEFAULT_IPFS_GATEWAY = "https://ipfs-node.fly.dev/ipfs";

export const getIpfsGatewayFromStorage = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored?.trim()) return stored.trim();
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_IPFS_GATEWAY;
};

export const setIpfsGatewayInStorage = (url: string): void => {
  localStorage.setItem(STORAGE_KEY, url.trim());
};

export const clearIpfsGatewayInStorage = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const isValidIpfsGatewayUrl = (url: string): boolean => {
  const trimmed = url.trim();
  if (!trimmed) return false;
  return IPFS_GATEWAY_URL_REGEX.test(trimmed.endsWith("/") ? trimmed : trimmed + "/");
};

/** Resolve ipfs:// URIs to a gateway URL using the stored gateway or default. */
export const resolveIpfsUrl = (uri: string): string => {
  if (uri.startsWith("ipfs://")) {
    let gateway = getIpfsGatewayFromStorage();
    if (!gateway.endsWith("/")) gateway += "/";
    return uri.replace("ipfs://", gateway);
  }
  return uri;
};

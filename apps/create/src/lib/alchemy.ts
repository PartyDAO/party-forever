import type { NetworkName } from "@party-forever/contracts";
import { AlchemyClient } from "@party-forever/externals";
import type { AlchemyApiConfig } from "@party-forever/externals";
import { getAlchemyApiKeyFromStorage } from "@party-forever/ui";

function getApiKey(): string {
  const fromStorage = getAlchemyApiKeyFromStorage();
  if (fromStorage) return fromStorage;

  const key = import.meta.env.VITE_ALCHEMY_API_KEY as string | undefined;
  if (!key?.trim()) {
    throw new Error(
      "Alchemy API key is not configured. Set it in Settings or add VITE_ALCHEMY_API_KEY to your .env."
    );
  }
  return key;
}

/**
 * Creates an AlchemyClient for the given network.
 * Reads the API key fresh from localStorage on every call, falling back to the env var.
 */
export function createAlchemyClient(network: NetworkName): AlchemyClient {
  const config: AlchemyApiConfig = { apiKey: getApiKey(), network };
  return new AlchemyClient(config);
}

export { AlchemyClient, getAllNftsForOwner, getAllTokenBalances } from "@party-forever/externals";

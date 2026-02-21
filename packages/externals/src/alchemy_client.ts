import type { NetworkName } from "@party-forever/contracts";

import type {
  Alchemy_NftV3,
  AlchemyApiConfig,
  AlchemyNFTsByOwnerResponse,
  AlchemyRequestOptions,
  AlchemyTokenBalancesResponse,
  AlchemyTokenMetadata,
  AlchemyTokenMetadataResponse,
  TokenBalance,
  TokenWithMetadata
} from "./types.ts";

const ALCHEMY_NETWORK_SUBDOMAINS: Record<NetworkName, string> = {
  base: "base-mainnet",
  mainnet: "eth-mainnet",
  zora: "zora-mainnet"
};

function getAlchemyBaseUrl(config: AlchemyApiConfig): string {
  const subdomain = ALCHEMY_NETWORK_SUBDOMAINS[config.network];
  return `https://${subdomain}.g.alchemy.com/v2/${config.apiKey}`;
}

function getAlchemyNftApiBaseUrl(config: AlchemyApiConfig): string {
  const subdomain = ALCHEMY_NETWORK_SUBDOMAINS[config.network];
  return `https://${subdomain}.g.alchemy.com/nft/v3/${config.apiKey}`;
}

export class AlchemyClient {
  private readonly url: string;
  private readonly nftApiBaseUrl: string;

  constructor(config: AlchemyApiConfig) {
    this.url = getAlchemyBaseUrl(config);
    this.nftApiBaseUrl = getAlchemyNftApiBaseUrl(config);
  }

  async getTokenBalances(
    address: string,
    tokenAddresses?: string[],
    pageKey?: string
  ): Promise<{ tokenBalances: TokenBalance[]; pageKey?: string }> {
    const secondParam = tokenAddresses ?? "erc20";
    const params: unknown[] = [address, secondParam];
    if (pageKey) {
      params.push({ pageKey });
    }

    const data = await this.makeRequest<AlchemyTokenBalancesResponse>(
      "alchemy_getTokenBalances",
      params
    );

    return {
      tokenBalances:
        data.result?.tokenBalances?.map((res) => ({
          contractAddress: res.contractAddress,
          tokenBalance: res.tokenBalance === "0x" ? "0" : BigInt(res.tokenBalance).toString()
        })) ?? [],
      pageKey: data.result?.pageKey
    };
  }

  async getTokenMetadata(contractAddress: string): Promise<AlchemyTokenMetadata> {
    const data = await this.makeRequest<AlchemyTokenMetadataResponse>("alchemy_getTokenMetadata", [
      contractAddress
    ]);
    return data.result;
  }

  private async makeRequest<T>(method: string, params: unknown[]): Promise<T> {
    const opts: AlchemyRequestOptions = {
      jsonrpc: "2.0",
      method,
      params,
      id: "42"
    };

    const response = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts)
    });

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getNftsForOwner(
    ownerAddress: string,
    pageKey?: string | null
  ): Promise<{ ownedNfts: Alchemy_NftV3[]; pageKey?: string | null }> {
    const params = new URLSearchParams({
      owner: ownerAddress,
      pageSize: "50"
    });
    if (pageKey) {
      params.set("pageKey", pageKey);
    }
    const url = `${this.nftApiBaseUrl}/getNFTsForOwner?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alchemy NFT API error: ${response.statusText}`);
    }
    const data: AlchemyNFTsByOwnerResponse = await response.json();
    return {
      ownedNfts: data.ownedNfts ?? [],
      pageKey: data.pageKey ?? undefined
    };
  }
}

export async function getAllTokenBalances(
  client: AlchemyClient,
  address: string,
  tokenAddresses?: string[]
): Promise<TokenBalance[]> {
  const tokenBalances: TokenBalance[] = [];
  let pageKey: string | undefined;

  do {
    const result = await client.getTokenBalances(address, tokenAddresses, pageKey);
    tokenBalances.push(...result.tokenBalances);
    pageKey = result.pageKey;
  } while (pageKey);

  return tokenBalances;
}

export async function getTokenBalancesWithMetadata(
  client: AlchemyClient,
  address: string
): Promise<TokenWithMetadata[]> {
  const tokens = await getAllTokenBalances(client, address);
  const withBalance = tokens.filter((t) => t.tokenBalance !== "0");
  const uniqueAddresses = [...new Set(withBalance.map((t) => t.contractAddress))];

  const metadataResults = await Promise.allSettled(
    uniqueAddresses.map((contractAddress) =>
      client.getTokenMetadata(contractAddress).then((metadata) => ({ contractAddress, metadata }))
    )
  );

  const metadataByAddress: Record<string, AlchemyTokenMetadata> = {};
  for (const result of metadataResults) {
    if (result.status === "fulfilled") {
      metadataByAddress[result.value.contractAddress] = result.value.metadata;
    }
  }

  return withBalance.map((t) => ({
    contractAddress: t.contractAddress,
    tokenBalance: t.tokenBalance,
    name: metadataByAddress[t.contractAddress]?.name ?? "",
    symbol: metadataByAddress[t.contractAddress]?.symbol ?? "",
    decimals:
      metadataByAddress[t.contractAddress]?.decimals ??
      metadataByAddress[t.contractAddress]?.decimal ??
      18,
    logo: metadataByAddress[t.contractAddress]?.logo ?? null
  }));
}

export async function getAllNftsForOwner(
  client: AlchemyClient,
  ownerAddress: string
): Promise<Alchemy_NftV3[]> {
  const allOwnedNfts: Alchemy_NftV3[] = [];
  let pageKey: string | null = null;

  do {
    const result = await client.getNftsForOwner(ownerAddress, pageKey);
    allOwnedNfts.push(...result.ownedNfts);
    pageKey = result.pageKey ?? null;
  } while (pageKey);

  return allOwnedNfts;
}

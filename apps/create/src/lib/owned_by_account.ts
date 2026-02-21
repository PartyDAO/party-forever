import { getAddress } from "viem";

import type { AlchemyClient, TokenBalance } from "@party-forever/externals";
import { getAllNftsForOwner, getAllTokenBalances } from "@party-forever/externals";

import partyNftTokenData from "./party_nft_token_data.json";

export interface NFTRecord {
  nftContract: string;
  name: string;
  imageURI: string;
  owner: string;
  chainId: string;
  blockTimestamp: string;
}

export interface TokenRecord {
  token: string;
  tokenName: string;
  tokenImage: string;
  tokenSymbol: string;
  creator: string;
  chainId: string;
  blockTimestamp: string;
}

type PartyNftTokenData = {
  nfts: Record<
    string,
    {
      nftContract: string;
      name: string;
      imageURI: string;
      owner: string;
      chainId: string;
      blockTimestamp: string;
    }
  >;
  tokens: Record<
    string,
    {
      token: string;
      tokenName: string;
      tokenImage: string;
      tokenSymbol: string;
      creator: string;
      chainId: string;
      blockTimestamp: string;
    }
  >;
};

const data = partyNftTokenData as PartyNftTokenData;

/** Normalized address -> token entry for Party tokens. */
const partyTokensByAddress = new Map(
  Object.entries(data.tokens).map(([addr, t]) => [getAddress(addr), [addr, t] as const])
);

/** Normalized address -> NFT entry for Party NFTs. */
const partyNftsByAddress = new Map(
  Object.entries(data.nfts).map(([addr, nft]) => [getAddress(addr), [addr, nft] as const])
);

const toNftRecord = ([contract, nft]: [string, PartyNftTokenData["nfts"][string]]): NFTRecord => ({
  nftContract: contract,
  name: nft.name,
  imageURI: nft.imageURI,
  owner: nft.owner,
  chainId: nft.chainId,
  blockTimestamp: nft.blockTimestamp
});

const toTokenRecord = ([, t]: [string, PartyNftTokenData["tokens"][string]]): TokenRecord => ({
  token: t.token,
  tokenName: t.tokenName,
  tokenImage: t.tokenImage,
  tokenSymbol: t.tokenSymbol,
  creator: t.creator,
  chainId: t.chainId,
  blockTimestamp: t.blockTimestamp
});

export const getOwnedNftsByAccount = (accountAddress: string): NFTRecord[] => {
  const normalized = getAddress(accountAddress);
  return Object.entries(data.nfts)
    .filter(([, nft]) => getAddress(nft.owner) === normalized)
    .map(toNftRecord)
    .sort((a, b) => Number(BigInt(b.blockTimestamp) - BigInt(a.blockTimestamp)));
};

export const getOwnedTokensByAccount = (accountAddress: string): TokenRecord[] => {
  const normalized = getAddress(accountAddress);
  return Object.entries(data.tokens)
    .filter(([, t]) => getAddress(t.creator) === normalized)
    .map(toTokenRecord)
    .sort((a, b) => Number(BigInt(b.blockTimestamp) - BigInt(a.blockTimestamp)));
};

/** Token image URI from party data if this is a known Party token, else null. */
export const getPartyTokenImage = (tokenAddress: string): string | null => {
  const entry = partyTokensByAddress.get(getAddress(tokenAddress));
  return entry ? entry[1].tokenImage : null;
};

/**
 * Party tokens the account holds (balance > 0) via Alchemy getAllTokenBalances,
 * merged with party_nft_token_data. Use for profile "tokens you hold".
 */
export const getPartyTokenBalancesForAccount = async (
  client: AlchemyClient,
  accountAddress: string
): Promise<TokenRecord[]> => {
  const balances = await getAllTokenBalances(client, accountAddress);
  const withBalance = balances.filter((b: TokenBalance) => b.tokenBalance !== "0");
  const result: TokenRecord[] = [];
  for (const b of withBalance) {
    const key = getAddress(b.contractAddress);
    const entry = partyTokensByAddress.get(key);
    if (entry) result.push(toTokenRecord([entry[0], entry[1]]));
  }
  return result.sort((a, b) => Number(BigInt(b.blockTimestamp) - BigInt(a.blockTimestamp)));
};

/**
 * Party NFTs the account owns via Alchemy getAllNftsForOwner,
 * merged with party_nft_token_data (name, imageURI). Use for profile "NFTs you own".
 */
export const getPartyNftsOwnedByAccount = async (
  client: AlchemyClient,
  accountAddress: string
): Promise<NFTRecord[]> => {
  const ownedNfts = await getAllNftsForOwner(client, accountAddress);
  const result: NFTRecord[] = [];
  for (const nft of ownedNfts) {
    const key = getAddress(nft.contract.address);
    const entry = partyNftsByAddress.get(key);
    if (entry) result.push(toNftRecord([entry[0], entry[1]]));
  }
  return result.sort((a, b) => Number(BigInt(b.blockTimestamp) - BigInt(a.blockTimestamp)));
};

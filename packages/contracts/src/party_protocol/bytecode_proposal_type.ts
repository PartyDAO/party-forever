/** ERC20 transfer(address,uint256) */
const SELECTOR_ERC20_TRANSFER = "0xa9059cbb";
/** ERC721 transferFrom(address,address,uint256) */
const SELECTOR_ERC721_TRANSFER_FROM = "0x23b872dd";

export const BytecodeProposalType = {
  Default: "Default",
  SeaportDirectSale: "SeaportDirectSale",
  SeaportAdvancedDirectSale: "SeaportAdvancedDirectSale",
  EthTransfer: "EthTransfer",
  AddMember: "AddMember",
  SellMemberships: "SellMemberships",
  TokenTransfer: "TokenTransfer",
  NftTransfer: "NftTransfer",
  ZoraCreateCollection: "ZoraCreateCollection",
  ZoraClaimEarnings: "ZoraClaimEarnings"
} as const;

export type BytecodeProposalType = (typeof BytecodeProposalType)[keyof typeof BytecodeProposalType];

export interface ArbitraryBytecodeAnnotatedDetails {
  bytecodeProposalType: BytecodeProposalType;
  label: string;
}

const BYTECODE_PROPOSAL_TYPE_LABELS: Record<BytecodeProposalType, string> = {
  [BytecodeProposalType.Default]: "Arbitrary call",
  [BytecodeProposalType.SeaportDirectSale]: "Seaport direct sale",
  [BytecodeProposalType.SeaportAdvancedDirectSale]: "Seaport advanced direct sale",
  [BytecodeProposalType.EthTransfer]: "ETH transfer",
  [BytecodeProposalType.AddMember]: "Add member",
  [BytecodeProposalType.SellMemberships]: "Sell memberships",
  [BytecodeProposalType.TokenTransfer]: "Token transfer",
  [BytecodeProposalType.NftTransfer]: "NFT transfer",
  [BytecodeProposalType.ZoraCreateCollection]: "Zora create collection",
  [BytecodeProposalType.ZoraClaimEarnings]: "Zora claim earnings"
};

export function getBytecodeProposalTypeLabel(bytecodeProposalType: BytecodeProposalType): string {
  return BYTECODE_PROPOSAL_TYPE_LABELS[bytecodeProposalType] ?? bytecodeProposalType;
}

/**
 * Inspects the first call in a decoded ArbitraryCalls proposal to
 * determine the bytecode proposal subtype and its human-readable label.
 * Returns null if no subtype can be determined.
 */
export function inferArbitraryBytecodeAnnotatedDetails(
  calls: ReadonlyArray<{ readonly data: `0x${string}` }>
): ArbitraryBytecodeAnnotatedDetails | null {
  if (!calls.length || !calls[0].data) {
    return null;
  }
  const selector = calls[0].data.slice(0, 10).toLowerCase();
  if (selector === SELECTOR_ERC20_TRANSFER) {
    return {
      bytecodeProposalType: BytecodeProposalType.TokenTransfer,
      label: getBytecodeProposalTypeLabel(BytecodeProposalType.TokenTransfer)
    };
  }
  if (selector === SELECTOR_ERC721_TRANSFER_FROM) {
    return {
      bytecodeProposalType: BytecodeProposalType.NftTransfer,
      label: getBytecodeProposalTypeLabel(BytecodeProposalType.NftTransfer)
    };
  }
  return null;
}

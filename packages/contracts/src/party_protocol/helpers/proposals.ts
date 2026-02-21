export enum AnnotatedBytecodeProposalType {
  Default = "Default",
  SeaportDirectSale = "SeaportDirectSale",
  SeaportAdvancedDirectSale = "SeaportAdvancedDirectSale",
  EthTransfer = "EthTransfer",
  AddMember = "AddMember",
  SellMemberships = "SellMemberships",
  TokenTransfer = "TokenTransfer",
  NftTransfer = "NftTransfer",
  ZoraCreateCollection = "ZoraCreateCollection",
  ZoraClaimEarnings = "ZoraClaimEarnings"
}

export const ANNOTATED_BYTECODE_PROPOSAL_TYPE_LABELS: Record<
  AnnotatedBytecodeProposalType,
  string
> = {
  [AnnotatedBytecodeProposalType.Default]: "Arbitrary call",
  [AnnotatedBytecodeProposalType.SeaportDirectSale]: "Seaport direct sale",
  [AnnotatedBytecodeProposalType.SeaportAdvancedDirectSale]: "Seaport advanced direct sale",
  [AnnotatedBytecodeProposalType.EthTransfer]: "ETH transfer",
  [AnnotatedBytecodeProposalType.AddMember]: "Add member",
  [AnnotatedBytecodeProposalType.SellMemberships]: "Sell memberships",
  [AnnotatedBytecodeProposalType.TokenTransfer]: "Token transfer",
  [AnnotatedBytecodeProposalType.NftTransfer]: "NFT transfer",
  [AnnotatedBytecodeProposalType.ZoraCreateCollection]: "Zora create collection",
  [AnnotatedBytecodeProposalType.ZoraClaimEarnings]: "Zora claim earnings"
};

export interface ArbitraryBytecodeAnnotatedDetails {
  bytecodeProposalType: AnnotatedBytecodeProposalType;
  label: string;
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
  // ERC20 transfer(address,uint256)
  if (selector === "0xa9059cbb") {
    return {
      bytecodeProposalType: AnnotatedBytecodeProposalType.TokenTransfer,
      label: ANNOTATED_BYTECODE_PROPOSAL_TYPE_LABELS[AnnotatedBytecodeProposalType.TokenTransfer]
    };
  }
  // ERC721 transferFrom(address,address,uint256)
  if (selector === "0x23b872dd") {
    return {
      bytecodeProposalType: AnnotatedBytecodeProposalType.NftTransfer,
      label: ANNOTATED_BYTECODE_PROPOSAL_TYPE_LABELS[AnnotatedBytecodeProposalType.NftTransfer]
    };
  }
  return null;
}

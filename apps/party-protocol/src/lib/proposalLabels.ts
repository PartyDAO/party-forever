import {
  BytecodeProposalType,
  getBytecodeProposalTypeLabel,
  type ProposalData,
  ProposalType
} from "@party-forever/contracts";

export { BytecodeProposalType, getBytecodeProposalTypeLabel };

/**
 * Human-readable labels for top-level proposal types (from the contract enum).
 */
const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
  Invalid: "Invalid",
  ListOnOpensea: "List on OpenSea",
  ListOnZora: "List on Zora",
  Fractionalize: "Fractionalize",
  ArbitraryCalls: "Arbitrary calls",
  UpgradeProposalEngineImpl: "Upgrade proposal engine",
  ListOnOpenseaAdvanced: "List on OpenSea (advanced)",
  Distribute: "Distribute",
  AddAuthority: "Add authority",
  Operator: "Operator"
};

export function getProposalTypeLabel(
  proposalType: ProposalType,
  proposalData?: ProposalData
): string {
  if (
    proposalType === ProposalType.ArbitraryCalls &&
    proposalData &&
    "annotatedDetails" in proposalData &&
    proposalData.annotatedDetails
  ) {
    return proposalData.annotatedDetails.label;
  }
  return PROPOSAL_TYPE_LABELS[proposalType] ?? proposalType;
}

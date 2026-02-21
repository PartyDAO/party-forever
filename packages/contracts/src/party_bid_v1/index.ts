import type { partyBidV1Abi } from "./abis/party_bid_v1.ts";
import type { partyBidV2Abi } from "./abis/party_bid_v2.ts";
import type { partyBidV3Abi } from "./abis/party_bid_v3.ts";

export type PartyBidAbi = typeof partyBidV1Abi | typeof partyBidV2Abi | typeof partyBidV3Abi;

export { partyBidV1Abi } from "./abis/party_bid_v1.ts";
export { partyBidV2Abi } from "./abis/party_bid_v2.ts";
export { partyBidV3Abi } from "./abis/party_bid_v3.ts";
export {
  PartyBid,
  PartyBidStatus,
  type PartyBidClaimedEvent,
  type PartyBidContributedEvent
} from "./party_bid_contract.ts";
export { getContractVersion } from "./utils.ts";

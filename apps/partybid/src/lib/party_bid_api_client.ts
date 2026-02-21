import { PartyBidApiClient } from "@party-forever/externals";
import { getDbApiUrl } from "@party-forever/ui";

export const getPartyBidApiClient = () => new PartyBidApiClient(getDbApiUrl());

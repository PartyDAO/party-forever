import { DbPartyProtocolClient } from "@party-forever/externals";
import { getDbApiUrl } from "@party-forever/ui";

export const getDbPartyProtocolClient = () => new DbPartyProtocolClient(getDbApiUrl());

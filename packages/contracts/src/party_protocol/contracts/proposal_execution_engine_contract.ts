import type { GetTransactionReceiptReturnType } from "viem";
import { parseEventLogs } from "viem";

import type { ProposalExecutionEngineABI } from "../configs/proposal_execution_engine_contract_config.ts";
import { PROPOSAL_EXECUTION_ENGINE_CONTRACTS } from "../configs/proposal_execution_engine_contract_config.ts";
import { type Client, findContractAbi } from "../contract_utils.ts";
import type { NetworkName, SeaportOrderEvent } from "../types.ts";

export class ProposalExecutionEngine {
  private abi: ProposalExecutionEngineABI;

  /**
   * Discovers the ABI from the implementation address.
   */
  constructor(
    networkName: NetworkName,
    proposalExecutionEngineAddress: `0x${string}`,
    _client: Client
  ) {
    this.abi = findContractAbi(
      proposalExecutionEngineAddress,
      networkName,
      PROPOSAL_EXECUTION_ENGINE_CONTRACTS
    );
  }

  /**
   * Finds order details from OpenseaOrderListed or OpenseaAdvancedOrderListed
   * events in transaction receipt logs. Returns null if no matching event is found.
   */
  findOrderDetails(
    proposalExecutedLogs: GetTransactionReceiptReturnType["logs"]
  ): SeaportOrderEvent | null {
    const advancedEvents = parseEventLogs({
      abi: this.abi.abi,
      logs: proposalExecutedLogs,
      eventName: "OpenseaAdvancedOrderListed" as const
    });
    if (advancedEvents.length > 0) {
      const { orderHash, token, tokenId, expiry, startPrice, endPrice } = advancedEvents[0].args;
      return {
        type: "advanced",
        orderHash,
        token,
        tokenId,
        expiry,
        startPriceWei: startPrice,
        endPriceWei: endPrice
      };
    }

    const standardEvents = parseEventLogs({
      abi: this.abi.abi,
      logs: proposalExecutedLogs,
      eventName: "OpenseaOrderListed" as const
    });
    if (standardEvents.length > 0) {
      const { orderHash, token, tokenId, expiry, listPrice } = standardEvents[0].args;
      return { type: "standard", orderHash, token, tokenId, expiry, listPriceWei: listPrice };
    }

    return null;
  }
}

import { describe, expect, it } from "vitest";
import { Party } from "../../../src/index.ts";

describe("Party Proposals", () => {
  const partyAddress = "0x87088b14c02e639453e91b4588611d4042ca1fc0";
  const networkName = "mainnet" as const;

  it("fetches proposals from the party contract", async () => {
    const party = await Party.create(networkName, partyAddress);
    const proposals = await party.fetchProposals();

    // console.log(JSON.stringify(proposals, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2))

    expect(Array.isArray(proposals)).toBe(true);
    expect(proposals.length).toBeGreaterThanOrEqual(1);

    const firstProposal = proposals[0];
    expect(firstProposal.proposalId).toBe(1n);
    expect(firstProposal.proposer).toBe("0xba5f2ffb721648Ee6a6c51c512A258ec62f1D6af");
    expect(firstProposal.proposal.maxExecutableTime).toBe(1694668059);
    expect(firstProposal.proposal.cancelDelay).toBe(3628800);
    expect(firstProposal.proposal.proposalData.proposalType).toBe("ArbitraryCalls");
    expect(firstProposal.blockNumber).toBe(17490218n);
    expect(firstProposal.transactionHash).toBe(
      "0x1ea6c44b1788aa1e485270aa12d487ff1ec3659ebe1e998aa9485438c4ccb508"
    );
  });

  it("includes seaportOrderData in proposalData for ListOnOpensea proposals", async () => {
    const partyAddress = "0x8d38e1d4a879e3ef003da26d7b0be998cfccfb9e";
    const party = await Party.create(networkName, partyAddress);
    const proposals = await party.fetchProposals();

    // Find proposal #34 which is a ListOnOpensea proposal
    const proposal34 = proposals.find((p) => p.proposalId === 34n);
    expect(proposal34).toBeDefined();
    expect(proposal34!.proposal.proposalData.proposalType).toBe("ListOnOpensea");

    // Type guard: only ListOnOpensea and ListOnOpenseaAdvanced have seaportOrderData
    const proposalData = proposal34!.proposal.proposalData;
    expect(proposalData.proposalType).toBe("ListOnOpensea");

    // Verify seaportOrderData is populated inside proposalData
    const orderData = (
      proposalData as { seaportOrderData?: import("../../src/types.ts").SeaportOrderDetails }
    ).seaportOrderData;
    expect(orderData).toBeDefined();
    expect(orderData!.type).toBe("standard");
    expect(orderData!.orderHash).toBe(
      "0x54be74e639675b4226ac491e1ccaac3cdfb89f2b05a8e754bb6e24a6e17bbb92"
    );
    expect(orderData!.token).toBe("0x5Af0D9827E0c53E4799BB226655A1de152A425a5");
    expect(orderData!.tokenId).toBe(9076n);
    expect(orderData!.expiry).toBe(1770831863n);

    if (orderData!.type === "standard") {
      expect(orderData!.listPriceWei).toBe(1034000000000000000n);
    }
  });
});

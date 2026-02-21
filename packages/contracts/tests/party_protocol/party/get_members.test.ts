import { describe, expect, it } from "vitest";

import { Party } from "../../../src/index.ts";

describe("Party getMembers", () => {
  const partyAddress = "0x548d125a34aa3b242659aa0a424e85f34d2a7016";
  const networkName = "mainnet" as const;

  it("fetches members with their voting power", async () => {
    const party = await Party.create(networkName, partyAddress);
    const members = await party.getMembers();

    expect(Array.isArray(members)).toBe(true);

    const delegateAddress = "0xba5f2ffb721648ee6a6c51c512a258ec62f1d6af";

    const totalVotingPower = 777000000000000000n;

    const member1 = members.find(
      (m) => m.partyMemberAddress.toLowerCase() === "0xba5f2ffb721648ee6a6c51c512a258ec62f1d6af"
    );
    expect(member1).toBeDefined();
    expect(member1!.totalIntrinsicVotingPower).toBe(200000000000000000n);
    expect(member1!.delegatedTo.toLowerCase()).toBe(delegateAddress);
    expect(member1!.currentVotingPower).toBe(totalVotingPower);

    const member2 = members.find(
      (m) => m.partyMemberAddress.toLowerCase() === "0xb55772467171f20b2c0a797719a579cea591be12"
    );
    expect(member2).toBeDefined();
    expect(member2!.totalIntrinsicVotingPower).toBe(177000000000000000n);
    expect(member2!.delegatedTo.toLowerCase()).toBe(delegateAddress);
    expect(member2!.currentVotingPower).toBe(0n);

    const member3 = members.find(
      (m) => m.partyMemberAddress.toLowerCase() === "0xaed58605cf7d6a9396f7c0539d51df6763808208"
    );
    expect(member3).toBeDefined();
    expect(member3!.totalIntrinsicVotingPower).toBe(200000000000000000n);
    expect(member3!.delegatedTo.toLowerCase()).toBe(delegateAddress);
    expect(member3!.currentVotingPower).toBe(0n);

    const member4 = members.find(
      (m) => m.partyMemberAddress.toLowerCase() === "0x448cd76be24df28adabe7786135f9b14d50e6dab"
    );
    expect(member4).toBeDefined();
    expect(member4!.totalIntrinsicVotingPower).toBe(200000000000000000n);
    expect(member4!.delegatedTo.toLowerCase()).toBe(delegateAddress);
    expect(member4!.currentVotingPower).toBe(0n);
  });
});

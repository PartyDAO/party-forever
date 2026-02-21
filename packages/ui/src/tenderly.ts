const TENDERLY_SIMULATOR_NEW_URL = "https://dashboard.tenderly.co/simulator/new";

export function buildTenderlySimulatorUrl(params: {
  from: `0x${string}`;
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
  networkId: number;
}): string {
  const search = new URLSearchParams({
    contractAddress: params.to,
    rawFunctionInput: params.data,
    from: params.from,
    network: String(params.networkId),
    value: params.value.toString(10),
    project: "party.app"
  });
  return `${TENDERLY_SIMULATOR_NEW_URL}?${search.toString()}`;
}

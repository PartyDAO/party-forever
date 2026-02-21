/**
 * Types for WalletConnect session requests when the Party acts as a wallet.
 * Used to capture eth_sendTransaction params from a dapp for creating a proposal.
 */

export type WalletConnectCallRequest = {
  id: string;
  jsonrpc: string;
  method: string;
  params: unknown;
};

export type WalletConnectSendTransactionRequest = WalletConnectCallRequest & {
  method: "eth_sendTransaction";
  params: Array<{
    data?: `0x${string}`;
    from: string;
    gas?: string;
    gasPrice?: string;
    nonce?: string;
    to: string;
    value?: string | bigint;
  }>;
};

export type WalletConnectDapp = {
  name: string;
  url: string;
};

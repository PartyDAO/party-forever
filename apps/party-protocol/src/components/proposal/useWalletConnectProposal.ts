import type { NetworkName } from "@party-forever/contracts";
import { Core } from "@walletconnect/core";
import type { JsonRpcResponse } from "@walletconnect/jsonrpc-types";
import type { ProposalTypes } from "@walletconnect/types";
import { buildApprovedNamespaces, getSdkError, parseUri } from "@walletconnect/utils";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { useEffect, useRef, useState } from "react";

import type {
  WalletConnectDapp,
  WalletConnectSendTransactionRequest
} from "@/components/proposal/wallet_connect_types.ts";
import { getChainIdForNetwork } from "@/lib/client.ts";

const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as
  | string
  | undefined;

export type UseWalletConnectProposalParams = {
  network: NetworkName;
  partyAddress: `0x${string}`;
  /** If false, reject eth_sendTransaction with value > 0 */
  canSendValue?: boolean;
};

export type UseWalletConnectProposalResult = {
  projectIdMissing: boolean;
  isConnecting: boolean;
  walletConnectError: string | null;
  onWalletConnectUriSubmit: (uri: string) => Promise<boolean>;
  dapp: WalletConnectDapp | null;
  isConnected: boolean;
  callRequest: WalletConnectSendTransactionRequest | null;
  clearCallRequest: () => void;
  onDisconnect: () => void;
};

export const useWalletConnectProposal = ({
  network,
  partyAddress,
  canSendValue = true
}: UseWalletConnectProposalParams): UseWalletConnectProposalResult => {
  const [web3Wallet, setWeb3Wallet] = useState<InstanceType<typeof Web3Wallet> | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnectError, setWalletConnectError] = useState<string | null>(null);
  const [dapp, setDapp] = useState<WalletConnectDapp | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callRequest, setCallRequest] = useState<WalletConnectSendTransactionRequest | null>(null);

  const chainId = getChainIdForNetwork(network);
  const partyEIP155Namespace = `eip155:${chainId}`;

  const onConnectRef = useRef((payload: WalletConnectDapp) => {
    setDapp(payload);
    setIsConnected(true);
  });
  onConnectRef.current = (payload: WalletConnectDapp) => {
    setDapp(payload);
    setIsConnected(true);
  };

  const onDisconnectRef = useRef(() => {
    setIsConnected(false);
    setDapp(null);
    setCallRequest(null);
  });
  onDisconnectRef.current = () => {
    setIsConnected(false);
    setDapp(null);
    setCallRequest(null);
  };

  const clearCallRequest = () => {
    setCallRequest(null);
  };

  useEffect(() => {
    if (!web3Wallet) {
      return;
    }

    const handleSessionProposal = async (event: { id: number; params: ProposalTypes.Struct }) => {
      const params = event.params;
      const { name, url } = params.proposer.metadata;
      onConnectRef.current({ name, url });

      const requiredNamespaces = params.requiredNamespaces;
      const eip155 = requiredNamespaces.eip155 ?? params.optionalNamespaces?.eip155;

      if (!eip155) {
        throw new Error("Dapp must request eip155 namespace");
      }

      const chains = eip155.chains?.includes(partyEIP155Namespace)
        ? eip155.chains
        : [...(eip155.chains ?? []), partyEIP155Namespace];

      const approvedNamespaces = buildApprovedNamespaces({
        proposal: params,
        supportedNamespaces: {
          eip155: {
            chains,
            methods: eip155.methods ?? ["eth_sendTransaction"],
            events: eip155.events ?? [],
            accounts: chains.map((chain: string) => {
              const chainIdPart = chain.split(":")[1];
              return `eip155:${chainIdPart}:${partyAddress}`;
            })
          }
        }
      });

      await web3Wallet.approveSession({
        id: event.id,
        namespaces: approvedNamespaces
      });
    };

    const handleSessionRequest = async (event: {
      id: number;
      topic: string;
      params: { request: { method: string; params: unknown } };
    }) => {
      const { request } = event.params;
      const { method } = request;

      if (method === "wallet_getCapabilities") {
        const wcResp: { topic: string; response: JsonRpcResponse } = {
          topic: event.topic,
          response: {
            id: event.id,
            jsonrpc: "2.0",
            result: {
              [`0x${chainId.toString(16)}`]: {
                eth_sendTransaction: { supported: true },
                wallet_getCapabilities: { supported: true }
              }
            }
          }
        };
        await web3Wallet.respondSessionRequest(wcResp);
        return;
      }

      if (method === "personal_sign") {
        throw new Error("Message signing is not supported.");
      }

      if (method !== "eth_sendTransaction") {
        throw new Error(`Unsupported method: ${method}`);
      }

      const txParams = Array.isArray(request.params) ? request.params[0] : null;
      if (!txParams || typeof txParams !== "object" || !("to" in txParams)) {
        throw new Error("Missing transaction params");
      }

      const valueStr =
        txParams.value !== undefined && txParams.value !== null ? String(txParams.value) : "0";
      const valueWei = BigInt(valueStr);
      if (!canSendValue && valueWei > 0n) {
        throw new Error("This Party cannot send ETH; proposal would send value");
      }

      const sendTxPayload: WalletConnectSendTransactionRequest = {
        id: "",
        jsonrpc: "2.0",
        method: "eth_sendTransaction",
        params: [
          {
            from: partyAddress,
            to: txParams.to as `0x${string}`,
            data: (txParams.data as `0x${string}`) ?? "0x",
            value: valueStr,
            gas: txParams.gas,
            gasPrice: txParams.gasPrice,
            nonce: txParams.nonce
          }
        ]
      };
      setCallRequest(sendTxPayload);
    };

    web3Wallet.on("session_proposal", handleSessionProposal as (args: unknown) => void);
    web3Wallet.on("session_request", handleSessionRequest as (args: unknown) => void);

    return () => {
      web3Wallet.off("session_proposal", handleSessionProposal as (args: unknown) => void);
      web3Wallet.off("session_request", handleSessionRequest as (args: unknown) => void);
      const pairings = web3Wallet.core.pairing.getPairings();
      void Promise.all(
        pairings.map((pairing) =>
          web3Wallet.disconnectSession({
            topic: pairing.topic,
            reason: getSdkError("USER_DISCONNECTED")
          })
        )
      ).then(() => {
        onDisconnectRef.current();
      });
    };
  }, [web3Wallet, partyAddress, partyEIP155Namespace, chainId, canSendValue]);

  const onWalletConnectUriSubmit = async (uri: string): Promise<boolean> => {
    if (!WALLETCONNECT_PROJECT_ID) {
      setWalletConnectError("VITE_WALLET_CONNECT_PROJECT_ID is not set");
      return false;
    }

    setWalletConnectError(null);
    setIsConnecting(true);

    try {
      const version = parseUri(uri).version;
      if (version !== 2) {
        setWalletConnectError("Only WalletConnect v2 URIs are supported (wc:...)");
        return false;
      }
    } catch {
      setWalletConnectError("Invalid WalletConnect URI");
      setIsConnecting(false);
      return false;
    }

    try {
      const core = new Core({
        projectId: WALLETCONNECT_PROJECT_ID
      }) as unknown as Parameters<typeof Web3Wallet.init>[0]["core"];
      const wallet = await Web3Wallet.init({
        core,
        metadata: {
          name: "Party",
          description: "Your group, onchain",
          url: "https://party.app",
          icons: ["https://party.app/favicon.ico"]
        }
      });
      await wallet.core.pairing.pair({ uri });
      setWeb3Wallet(wallet);
      return true;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to connect";
      setWalletConnectError(message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const onDisconnect = () => onDisconnectRef.current();

  return {
    projectIdMissing: !WALLETCONNECT_PROJECT_ID,
    isConnecting,
    walletConnectError,
    onWalletConnectUriSubmit,
    dapp,
    isConnected,
    callRequest,
    clearCallRequest,
    onDisconnect
  };
};

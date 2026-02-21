import { countedHttp, getRpcUrl } from "@party-forever/ui";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet
} from "@rainbow-me/rainbowkit/wallets";
import { base } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Party Create",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [base],
  multiInjectedProviderDiscovery: false,
  transports: {
    [base.id]: countedHttp(getRpcUrl("base"))
  },
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, rainbowWallet, rabbyWallet, walletConnectWallet]
    }
  ]
});

import { countedHttp, getRpcUrl } from "@party-forever/ui";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet
} from "@rainbow-me/rainbowkit/wallets";
import { mainnet } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "PartyBid",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: countedHttp(getRpcUrl("mainnet"))
  },
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, rainbowWallet, rabbyWallet, walletConnectWallet]
    }
  ]
});

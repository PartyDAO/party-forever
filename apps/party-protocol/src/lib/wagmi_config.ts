import { countedHttp, getRpcUrl } from "@party-forever/ui";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet
} from "@rainbow-me/rainbowkit/wallets";
import { base, mainnet, zora } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Party Forever",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [base, mainnet, zora],
  multiInjectedProviderDiscovery: false,
  transports: {
    [base.id]: countedHttp(getRpcUrl("base")),
    [mainnet.id]: countedHttp(getRpcUrl("mainnet")),
    [zora.id]: countedHttp(getRpcUrl("zora"))
  },
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, rainbowWallet, rabbyWallet, walletConnectWallet]
    }
  ]
});

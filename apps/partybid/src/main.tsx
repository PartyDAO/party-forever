import "./App.css";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { resolveEnsNames } from "@party-forever/externals";
import {
  DeveloperModeProvider,
  EnsProvider,
  RpcCounter,
  SimulatedWalletProvider
} from "@party-forever/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { WagmiProvider } from "wagmi";

import App from "./App.tsx";
import { getClient } from "./lib/client.ts";
import { wagmiConfig } from "./lib/wagmi_config.ts";

const ensResolver = (addresses: string[]) => resolveEnsNames(getClient(), addresses);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#00d4ff",
            accentColorForeground: "#0a0a0f",
            borderRadius: "medium",
            overlayBlur: "small"
          })}
        >
          <DeveloperModeProvider>
            <SimulatedWalletProvider>
              <EnsProvider resolver={ensResolver}>
                <BrowserRouter basename="/partybid">
                  <Routes>
                    <Route path="/*" element={<App />} />
                  </Routes>
                </BrowserRouter>
              </EnsProvider>
            </SimulatedWalletProvider>
            <RpcCounter />
          </DeveloperModeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);

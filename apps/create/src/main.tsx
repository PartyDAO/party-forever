import "./App.css";

import { darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { WagmiProvider } from "wagmi";

import { DeveloperModeProvider, RpcCounter } from "@party-forever/ui";
import App from "./App.tsx";
import { wagmiConfig } from "./lib/wagmi_config.ts";

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
            <BrowserRouter basename="/create">
              <Routes>
                <Route path="/*" element={<App />} />
              </Routes>
            </BrowserRouter>
            <RpcCounter />
          </DeveloperModeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);

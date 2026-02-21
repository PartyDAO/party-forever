import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { NavLink, Route, Routes } from "react-router";
import { isAddress } from "viem";

import {
  Button,
  Footer,
  Input,
  LandingLink,
  useAccount,
  useDeveloperMode,
  useSimulatedWallet
} from "@party-forever/ui";
import { ContributorDetails } from "@/pages/ContributorDetails.tsx";
import { Home } from "@/pages/Home.tsx";
import { PartyBidDetails } from "@/pages/PartyBidDetails.tsx";
import { Profile } from "@/pages/Profile.tsx";
import { PartyNameSearchResults } from "@/pages/search/PartyNameSearchResults.tsx";
import { Settings } from "@/pages/Settings.tsx";

const App = () => {
  const { developerMode } = useDeveloperMode();
  const { simulatedAddress, setSimulatedAddress } = useSimulatedWallet();
  const { account } = useAccount();
  const [simulateInput, setSimulateInput] = useState("");

  const handleSimulate = () => {
    const trimmed = simulateInput.trim();
    if (isAddress(trimmed)) {
      setSimulatedAddress(trimmed as `0x${string}`);
    }
  };

  const handleClearSimulate = () => {
    setSimulatedAddress(null);
    setSimulateInput("");
  };

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto flex flex-col">
      <nav className="p-4 border-b border-party-card-border backdrop-blur-md bg-black/20 sticky top-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-4">
          <NavLink to="/" className="text-lg font-bold tracking-tight party-gradient-text">
            PartyBid
          </NavLink>
          <LandingLink />
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `party-nav-link text-sm font-medium ${isActive ? "active text-[#00d4ff]" : ""}`
            }
          >
            Search
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `party-nav-link text-sm font-medium ${isActive ? "active text-[#00d4ff]" : ""}`
            }
          >
            Settings
          </NavLink>
        </div>
        {developerMode && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {simulatedAddress === null && (
              <>
                <Input
                  placeholder="Simulate wallet (0x...)"
                  value={simulateInput}
                  onChange={(e) => setSimulateInput(e.target.value)}
                  className="max-w-xs"
                />
                <Button type="button" onClick={handleSimulate} variant="outline">
                  Simulate
                </Button>
              </>
            )}
            {simulatedAddress !== null && (
              <>
                <span
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-400 ring-1 ring-amber-500/20"
                  title={simulatedAddress}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  </span>
                  Simulating {`${simulatedAddress.slice(0, 6)}…${simulatedAddress.slice(-4)}`}
                </span>
                <Button type="button" onClick={handleClearSimulate} variant="destructive">
                  Clear
                </Button>
              </>
            )}
          </div>
        )}
        <div
          className={`ml-auto flex items-center gap-3 ${simulatedAddress !== null ? "opacity-50 scale-95" : ""}`}
          title={simulatedAddress !== null ? "Real wallet (simulation is active)" : undefined}
        >
          {account && (
            <NavLink
              to={`/profile/${account}`}
              className={({ isActive }) =>
                `party-nav-link text-sm font-medium ${isActive ? "active text-[#00d4ff]" : ""}`
              }
            >
              Profile
            </NavLink>
          )}
          <ConnectButton showBalance={false} />
        </div>
      </nav>
      <main className="flex-1">
        <Routes>
          <Route index element={<Home />} />
          <Route path="search" element={<PartyNameSearchResults />} />
          <Route path="profile/:address" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="party/:address" element={<PartyBidDetails />} />
          <Route
            path="party/:address/contributor/:contributorAddress"
            element={<ContributorDetails />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

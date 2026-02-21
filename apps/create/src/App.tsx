import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavLink, Route, Routes } from "react-router";
import { useAccount } from "wagmi";

import { Footer, LandingLink } from "@party-forever/ui";
import { Profile } from "@/pages/Profile.tsx";
import { Search } from "@/pages/Search.tsx";
import { Settings } from "@/pages/Settings.tsx";
import { TokenDetails } from "@/pages/TokenDetails.tsx";

const App = () => {
  const { address } = useAccount();

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto flex flex-col">
      <nav className="p-4 border-b border-party-card-border backdrop-blur-md bg-black/20 sticky top-0 z-40 flex flex-wrap items-center gap-4">
        <NavLink to="/" end className="text-lg font-bold tracking-tight party-gradient-text">
          Party Create
        </NavLink>
        <LandingLink />
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `party-nav-link text-sm font-medium ${isActive ? "active text-[#00d4ff]" : ""}`
          }
        >
          Search
        </NavLink>
        {address && (
          <NavLink
            to={`/profile/${address}`}
            className={({ isActive }) =>
              `party-nav-link text-sm font-medium ${isActive ? "active text-[#00d4ff]" : ""}`
            }
          >
            Profile
          </NavLink>
        )}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `party-nav-link text-sm font-medium ${isActive ? "active text-[#00d4ff]" : ""}`
          }
        >
          Settings
        </NavLink>
        <div className="ml-auto">
          <ConnectButton showBalance={false} />
        </div>
      </nav>
      <main className="flex-1">
        <Routes>
          <Route index element={<Search />} />
          <Route path="profile/:userAddress" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path=":address" element={<TokenDetails />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

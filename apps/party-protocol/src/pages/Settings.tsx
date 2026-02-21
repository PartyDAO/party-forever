import { Link } from "react-router";

import { Button, SettingsPage } from "@party-forever/ui";

export const Settings = () => (
  <div className="p-6 flex flex-col gap-6">
    <Link to="/">
      <Button variant="ghost">← Back</Button>
    </Link>
    <SettingsPage rpcNetworkNames={["mainnet", "base", "zora"]} showDbApiUrl />
  </div>
);

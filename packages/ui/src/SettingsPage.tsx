import { useState } from "react";

import {
  clearAlchemyApiKeyInStorage,
  getAlchemyApiKeyFromStorage,
  setAlchemyApiKeyInStorage
} from "./alchemy_api_key_setting.ts";
import { Button } from "./Button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./Card.tsx";
import { useDeveloperMode } from "./DeveloperModeContext.tsx";
import { Input } from "./Input.tsx";
import {
  clearIpfsGatewayInStorage,
  DEFAULT_IPFS_GATEWAY,
  getIpfsGatewayFromStorage,
  isValidIpfsGatewayUrl,
  setIpfsGatewayInStorage
} from "./ipfs_gateway.ts";
import { Label } from "./Label.tsx";
import {
  DEFAULT_DB_API_URL_SETTING,
  getDbApiUrlSetting,
  setDbApiUrlSetting
} from "./db_api_url_settings.ts";
import {
  DEFAULT_RPC_URL_SETTING,
  getRpcUrlSetting,
  type RpcUrlSetting,
  setRpcUrlSetting
} from "./rpc_url_settings.ts";
import { Switch } from "./Switch.tsx";

const isValidRpcUrl = (url: string): boolean => url.startsWith("https://");

const RpcNetworkSetting = ({ networkName }: { networkName: string }) => {
  const [setting, setSetting] = useState<RpcUrlSetting>(() => getRpcUrlSetting(networkName));
  const [inputValue, setInputValue] = useState(() => {
    const stored = getRpcUrlSetting(networkName);
    return stored.rpcUrlType === "custom" ? stored.customRpcUrl : "";
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isDefault = setting.rpcUrlType === "default";

  const handleToggle = (useCustom: boolean) => {
    setError(null);
    setSaved(false);
    if (useCustom) {
      setInputValue("");
      setSetting({ rpcUrlType: "custom", customRpcUrl: "" });
      setRpcUrlSetting(networkName, { rpcUrlType: "custom", customRpcUrl: "" });
    } else {
      setInputValue("");
      setSetting(DEFAULT_RPC_URL_SETTING);
      setRpcUrlSetting(networkName, DEFAULT_RPC_URL_SETTING);
    }
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Enter an RPC URL.");
      return;
    }
    if (!isValidRpcUrl(trimmed)) {
      setError("URL must start with https://.");
      return;
    }
    const next: RpcUrlSetting = { rpcUrlType: "custom", customRpcUrl: trimmed };
    setRpcUrlSetting(networkName, next);
    setSetting(next);
    setSaved(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-4 cursor-pointer">
        <span className="text-sm font-semibold capitalize">{networkName}</span>
        <span className="ml-auto text-sm text-muted-foreground">
          {isDefault ? "Default" : "Custom URL"}
        </span>
        <Switch checked={!isDefault} onCheckedChange={handleToggle} />
      </label>
      {!isDefault && setting.rpcUrlType === "custom" && (
        <>
          <Input
            type="url"
            placeholder="https://eth-mainnet.g.alchemy.com/v2/..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setSaved(false);
            }}
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          {saved ? (
            <p className="flex h-9 items-center justify-center text-sm text-green-600">Updated!</p>
          ) : (
            <Button type="button" onClick={handleSave}>
              Update
            </Button>
          )}
        </>
      )}
    </div>
  );
};

const DbApiUrlSettingCard = () => {
  const [isCustom, setIsCustom] = useState(() => getDbApiUrlSetting().dbApiUrlType === "custom");
  const [inputValue, setInputValue] = useState(() => {
    const stored = getDbApiUrlSetting();
    return stored.dbApiUrlType === "custom" ? stored.customDbApiUrl : "";
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleToggle = (useCustom: boolean) => {
    setError(null);
    setSaved(false);
    setIsCustom(useCustom);
    setInputValue("");
    if (!useCustom) {
      setDbApiUrlSetting(DEFAULT_DB_API_URL_SETTING);
    }
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError("Enter an indexer API URL.");
      return;
    }
    if (!trimmed.startsWith("https://")) {
      setError("URL must start with https://.");
      return;
    }
    const url = trimmed.endsWith("/") ? trimmed : trimmed + "/";
    setDbApiUrlSetting({ dbApiUrlType: "custom", customDbApiUrl: url });
    setSaved(true);
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Indexer API Endpoint</CardTitle>
        <CardDescription>Override the default indexer API endpoint.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <label className="flex items-center gap-4 cursor-pointer">
          <span className="text-sm font-semibold">Indexer API</span>
          <span className="ml-auto text-sm text-muted-foreground">
            {isCustom ? "Custom URL" : "Default"}
          </span>
          <Switch checked={isCustom} onCheckedChange={handleToggle} />
        </label>
        {isCustom && (
          <>
            <Input
              type="url"
              placeholder="https://api.partydao.org/"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setSaved(false);
              }}
              aria-invalid={!!error}
            />
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            {saved ? (
              <p className="flex h-9 items-center justify-center text-sm text-green-600">
                Updated!
              </p>
            ) : (
              <Button type="button" onClick={handleSave}>
                Update
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

interface SettingsPageProps {
  rpcNetworkNames?: string[];
  showDbApiUrl?: boolean;
}

export const SettingsPage = ({ rpcNetworkNames, showDbApiUrl }: SettingsPageProps) => {
  const { developerMode, setDeveloperMode } = useDeveloperMode();
  const [ipfsValue, setIpfsValue] = useState(() => getIpfsGatewayFromStorage());
  const [ipfsError, setIpfsError] = useState<string | null>(null);
  const [alchemyValue, setAlchemyValue] = useState(() => getAlchemyApiKeyFromStorage() ?? "");
  const [alchemyError, setAlchemyError] = useState<string | null>(null);
  const [alchemySaved, setAlchemySaved] = useState(false);

  const handleIpfsSave = () => {
    setIpfsError(null);
    const trimmed = ipfsValue.trim();
    if (!trimmed) {
      setIpfsError("Enter a gateway URL.");
      return;
    }
    if (!isValidIpfsGatewayUrl(trimmed)) {
      setIpfsError("URL must be https and end with /ipfs (e.g. https://ipfs-node.fly.dev/ipfs).");
      return;
    }
    setIpfsGatewayInStorage(trimmed);
  };

  const handleIpfsClear = () => {
    setIpfsError(null);
    clearIpfsGatewayInStorage();
    setIpfsValue(DEFAULT_IPFS_GATEWAY);
  };

  const handleAlchemySave = () => {
    setAlchemyError(null);
    setAlchemySaved(false);
    const trimmed = alchemyValue.trim();
    if (!trimmed) {
      setAlchemyError("Enter an API key.");
      return;
    }
    setAlchemyApiKeyInStorage(trimmed);
    setAlchemySaved(true);
  };

  const handleAlchemyClear = () => {
    setAlchemyError(null);
    setAlchemySaved(false);
    clearAlchemyApiKeyInStorage();
    setAlchemyValue("");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Developer Mode</CardTitle>
          <CardDescription>
            Enable developer tools like wallet simulation and Tenderly transaction simulation links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium">Enable developer mode</span>
            <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
          </label>
        </CardContent>
      </Card>

      {rpcNetworkNames && rpcNetworkNames.length > 0 && (
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>RPC URLs</CardTitle>
            <CardDescription>
              Override the default RPC endpoint for each network. Must be an archive node that
              supports searching full block ranges for logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {rpcNetworkNames.map((networkName) => (
              <RpcNetworkSetting key={networkName} networkName={networkName} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>IPFS Gateway</CardTitle>
          <CardDescription>
            Override the IPFS gateway used to load images. Leave as default or set your own (e.g.
            Pinata).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ipfs-gateway">IPFS gateway URL</Label>
            <Input
              id="ipfs-gateway"
              type="url"
              placeholder={DEFAULT_IPFS_GATEWAY}
              value={ipfsValue}
              onChange={(e) => setIpfsValue(e.target.value)}
              aria-invalid={!!ipfsError}
            />
            <p className="text-muted-foreground text-xs">Format: https://your-gateway.com/ipfs</p>
          </div>
          {ipfsError && (
            <p className="text-destructive text-sm" role="alert">
              {ipfsError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleIpfsSave}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={handleIpfsClear}>
              Clear (use default)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Alchemy API Key</CardTitle>
          <CardDescription>
            Override the Alchemy API key used for token and NFT inventory lookups. Falls back to the
            built-in key if not set.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="alchemy-api-key">Alchemy API key</Label>
            <Input
              id="alchemy-api-key"
              type="text"
              placeholder="Enter your Alchemy API key"
              value={alchemyValue}
              onChange={(e) => {
                setAlchemyValue(e.target.value);
                setAlchemySaved(false);
              }}
              aria-invalid={!!alchemyError}
            />
          </div>
          {alchemyError && (
            <p className="text-destructive text-sm" role="alert">
              {alchemyError}
            </p>
          )}
          {alchemySaved && <p className="text-sm text-green-600">Saved!</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleAlchemySave}>
              Save
            </Button>
            <Button type="button" variant="outline" onClick={handleAlchemyClear}>
              Clear (use default)
            </Button>
          </div>
        </CardContent>
      </Card>

      {showDbApiUrl && <DbApiUrlSettingCard />}
    </div>
  );
};

export type RpcUrlSetting =
  | { rpcUrlType: "default" }
  | { rpcUrlType: "custom"; customRpcUrl: string };

export const DEFAULT_RPC_URL_SETTING: RpcUrlSetting = { rpcUrlType: "default" };

export const getRpcStorageKey = (networkName: string): string =>
  `RPC_URL_${networkName.toUpperCase()}`;

export const getRpcUrlSetting = (networkName: string): RpcUrlSetting => {
  try {
    const raw = localStorage.getItem(getRpcStorageKey(networkName));
    if (!raw) return DEFAULT_RPC_URL_SETTING;
    const parsed = JSON.parse(raw) as RpcUrlSetting;
    if (parsed.rpcUrlType === "custom" && !parsed.customRpcUrl) {
      throw new Error("Empty custom RPC URL");
    }
    return parsed;
  } catch {
    return DEFAULT_RPC_URL_SETTING;
  }
};

export const setRpcUrlSetting = (networkName: string, setting: RpcUrlSetting): void => {
  try {
    localStorage.setItem(getRpcStorageKey(networkName), JSON.stringify(setting));
  } catch {
    // Ignore storage errors
  }
};

const DEFAULT_RPC_ENV_VARS: Record<string, string> = {
  mainnet: "VITE_RPC_URL_MAINNET",
  base: "VITE_RPC_URL_BASE",
  zora: "VITE_RPC_URL_ZORA"
};

export const getRpcUrl = (networkName: string): string | undefined => {
  const setting = getRpcUrlSetting(networkName);
  if (setting.rpcUrlType === "custom") {
    return setting.customRpcUrl;
  }
  const envVar = DEFAULT_RPC_ENV_VARS[networkName];
  if (!envVar) return undefined;
  return import.meta.env[envVar] as string | undefined;
};

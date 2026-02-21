export type DbApiUrlSetting =
  | { dbApiUrlType: "default" }
  | { dbApiUrlType: "custom"; customDbApiUrl: string };

export const DEFAULT_DB_API_URL_SETTING: DbApiUrlSetting = { dbApiUrlType: "default" };

const DB_API_URL_STORAGE_KEY = "DB_API_URL";

export const getDbApiUrlSetting = (): DbApiUrlSetting => {
  try {
    const raw = localStorage.getItem(DB_API_URL_STORAGE_KEY);
    if (!raw) return DEFAULT_DB_API_URL_SETTING;
    const parsed = JSON.parse(raw) as DbApiUrlSetting;
    if (parsed.dbApiUrlType === "custom" && !parsed.customDbApiUrl) {
      throw new Error("Empty custom DB API URL");
    }
    return parsed;
  } catch {
    return DEFAULT_DB_API_URL_SETTING;
  }
};

export const setDbApiUrlSetting = (setting: DbApiUrlSetting): void => {
  try {
    localStorage.setItem(DB_API_URL_STORAGE_KEY, JSON.stringify(setting));
  } catch {
    // Ignore storage errors
  }
};

export const getDbApiUrl = (): string => {
  const setting = getDbApiUrlSetting();
  if (setting.dbApiUrlType === "custom") {
    return setting.customDbApiUrl;
  }
  const url = import.meta.env["VITE_DB_API_URL"] as string | undefined;
  if (!url) {
    throw new Error("Missing VITE_DB_API_URL environment variable");
  }
  return url;
};

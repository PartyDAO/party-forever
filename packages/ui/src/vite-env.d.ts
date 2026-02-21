// The UI package reads VITE_RPC_URL_* env vars via import.meta.env in rpc_url_settings.ts.
// Apps get these types from `/// <reference types="vite/client" />`, but this package
// doesn't depend on vite directly, so we declare the minimal types here.
interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

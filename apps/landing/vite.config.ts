import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const conductorPort = process.env.CONDUCTOR_PORT;
const port = Number(conductorPort) || 6173;
const kgptMachine = process.env.KGPT_MACHINE || "";
console.log(
  conductorPort
    ? `CONDUCTOR_PORT found: ${conductorPort}, using port ${port}`
    : `CONDUCTOR_PORT not set, using default port ${port}`
);

function kgptTitlePlugin() {
  return {
    name: "kgpt-title",
    transformIndexHtml(html: string) {
      if (!kgptMachine) return html;
      return html.replace(/<title>([^<]*)<\/title>/, `<title>${kgptMachine} | $1</title>`);
    }
  };
}

const partyProtocolPort = port + 1;
const createPort = port + 2;
const partybidPort = port + 3;

export default defineConfig({
  plugins: [react(), tailwindcss(), kgptTitlePlugin()],
  server: {
    port,
    host: true,
    allowedHosts: true,
    proxy: {
      "/party-protocol": {
        target: `http://localhost:${partyProtocolPort}`,
        ws: true,
        rewrite: (p) => (p === "/party-protocol" ? "/party-protocol/" : p)
      },
      "/create": {
        target: `http://localhost:${createPort}`,
        ws: true,
        rewrite: (p) => (p === "/create" ? "/create/" : p)
      },
      "/partybid": {
        target: `http://localhost:${partybidPort}`,
        ws: true,
        rewrite: (p) => (p === "/partybid" ? "/partybid/" : p)
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../../dist")
  }
});

import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const conductorPort = process.env.CONDUCTOR_PORT;
const port = Number(conductorPort) + 2 || 6175;
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

export default defineConfig({
  base: "/create/",
  plugins: [react(), tailwindcss(), kgptTitlePlugin()],
  server: {
    port,
    host: true,
    allowedHosts: true
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    outDir: path.resolve(__dirname, "../../dist/create")
  }
});

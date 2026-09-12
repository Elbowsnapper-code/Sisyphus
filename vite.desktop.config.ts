import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function flattenDesktopHtml(): Plugin {
  return {
    name: "flatten-desktop-html",
    closeBundle() {
      const nested = path.resolve("desktop-dist/desktop/index.html");
      const flat = path.resolve("desktop-dist/index.html");
      if (existsSync(nested)) {
        const html = readFileSync(nested, "utf8").replaceAll("../assets/", "./assets/");
        writeFileSync(flat, html);
        rmSync(path.resolve("desktop-dist/desktop"), { recursive: true, force: true });
      }
      const version = (readFileSync(path.resolve("src/lib/version.ts"), "utf8").match(/APP_VERSION = "([^"]+)"/) || [])[1] || "0";
      const files = [{ path: "index.html" }];
      const assetDir = path.resolve("desktop-dist/assets");
      if (existsSync(assetDir)) {
        for (const name of readdirSync(assetDir)) files.push({ path: `assets/${name}` });
      }
      writeFileSync(
        path.resolve("latest.json"),
        `${JSON.stringify(
          {
            version,
            notes: "Sisyphus writing desk. About → Update pulls this from GitHub.",
            files,
          },
          null,
          2,
        )}\n`,
      );
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [tailwindcss(), react(), flattenDesktopHtml()],
  resolve: {
    alias: { "@": path.resolve("src") },
    tsconfigPaths: true,
  },
  build: {
    outDir: path.resolve("desktop-dist"),
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: path.resolve("desktop/index.html"),
    },
  },
});

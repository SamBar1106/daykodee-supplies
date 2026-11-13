import { copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages project site is served under /daykodee-supplies/.
// Local dev and a future root domain (supplies.daykodee.com) use /.
const base = process.env.GITHUB_PAGES === "true" ? "/daykodee-supplies/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: "github-pages-spa-fallback",
      apply: "build",
      closeBundle() {
        const dist = resolve("dist");
        copyFileSync(resolve(dist, "index.html"), resolve(dist, "404.html"));
      },
    },
  ],
});

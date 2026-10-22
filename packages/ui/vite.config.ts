import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type PluginOption } from "vite-plus";

export default defineConfig({
  // WHY: the gallery tests import .svelte files, and the cast is there because vite-plus bundles
  // its own copy of the Plugin type plugin-svelte is typed against.
  plugins: [svelte()] as PluginOption[],
  // WHY: Svelte resolves to its server build under node, and mount() needs the browser one.
  resolve: { conditions: ["browser"] },
  test: { environment: "jsdom", include: ["src/**/*.test.ts"], setupFiles: ["./test-setup.ts"] },
});

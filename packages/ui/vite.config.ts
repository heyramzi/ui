import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type PluginOption } from "vite-plus";

export default defineConfig({
  // WHY: the showcase tests import .svelte files, and without the plugin vite parses the markup as JS.
  // WHY: plugin-svelte is typed against vite itself, vite-plus bundles its own copy of the Plugin type.
  plugins: [svelte()] as PluginOption[],
  // WHY: Svelte resolves to its server build under node, and mount() needs the browser one.
  resolve: { conditions: ["browser"] },
  test: { environment: "jsdom", include: ["src/**/*.test.ts"], setupFiles: ["./test-setup.ts"] },
});

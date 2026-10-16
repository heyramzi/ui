import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type PluginOption } from "vite-plus";
import { reviewDevServer } from "#dev/plugin.js";

export default defineConfig({
  // WHY: the dev middleware applies to `serve` only, so the library build never sees it.
  // WHY: plugin-svelte is typed against vite itself, vite-plus bundles its own copy of the Plugin type.
  // WHY: tree fragments build nodes, so the bundle holds no src-less <img> strings for a markup scan to misread.
  plugins: [svelte({ compilerOptions: { fragments: "tree" } }), reviewDevServer()] as PluginOption[],
  resolve: { conditions: ["browser"] },
  build: {
    target: "es2022",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "review", cssFileName: "review" },
  },
  test: { environment: "jsdom", include: ["src/**/*.test.ts", "scripts/**/*.test.ts"] },
});

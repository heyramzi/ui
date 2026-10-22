import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, type PluginOption } from "vite-plus";
import { reviewDevServer } from "#dev/plugin.js";

export default defineConfig({
  // The cast bridges vite-plus's own Plugin type, and tree fragments keep src-less <img> strings
  // out of the bundle, where a markup scan misreads them.
  plugins: [
    svelte({ compilerOptions: { fragments: "tree" } }),
    reviewDevServer(),
  ] as PluginOption[],
  resolve: { conditions: ["browser"] },
  build: {
    target: "es2022",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "review", cssFileName: "review" },
  },
  // WHY inline: @heyramzi/utils ships TypeScript source, and node refuses to strip types under node_modules.
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
    server: { deps: { inline: ["@heyramzi/utils"] } },
  },
});

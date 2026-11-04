import { defineConfig } from "vite-plus";

// The workspace root holds no app. This file is only the fmt and staged config vp reads.
export default defineConfig({
  fmt: {
    printWidth: 100,
    // Not ours to reformat: build output, vendored upstream copies the sync scripts diff
    // against, synced agent trees, and prose.
    ignorePatterns: [
      "**/.svelte-kit/**",
      "**/dist/**",
      "**/build/**",
      "**/.wrangler/**",
      "packages/ui/.upstream/**",
      "packages/ui/src/shadcn/**",
      "packages/ui/src/agents/vendor/**",
      "site/src/lib/shadcn-demos/**",
      ".claude/**",
      ".agents/**",
      ".impeccable/**",
      "**/*.md",
      "**/*.yml",
      "**/*.yaml",
    ],
    // Svelte files indent with tabs (the measured house style); .ts/.js keep 2 spaces.
    overrides: [{ files: ["**/*.svelte"], options: { svelte: true, useTabs: true } }],
  },
  staged: { "*.{js,mjs,ts,svelte,css}": "vp fmt" },
});

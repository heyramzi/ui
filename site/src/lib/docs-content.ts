/** The Get started page's words and code, shared by `/docs` and its Markdown twin `/docs.md`. */

export type DocStep = { label: string; lang: string; code: string };
export type DocBlock = { id: string; title: string; steps: DocStep[] };

export const docsTitle = "Get started";

export const docsIntro =
  "One Svelte 5 package for every app we ship: shadcn-svelte primitives, effects, charts, and whole blocks like a task board or a slide deck. It all runs on one set of tokens, so a brand colour reaches every part.";

export const docsDescription =
  "Install the package, load the tokens, import a part by its path, then name your brand and mount light and dark.";

const install = "pnpm add @heyramzi/ui bits-ui";

const css = `@import "tailwindcss";
@import "@heyramzi/ui/tokens.css";

/* Tailwind doesn't scan node_modules. Without this, a switch draws as a grey box. */
@source "../node_modules/@heyramzi/ui/src";`;

const usage = `<script lang="ts">
  import { Button } from "@heyramzi/ui/shadcn/button";
</script>

<Button>Save changes</Button>`;

const brand = `// src/lib/brand.ts
import { defineBrand } from "@heyramzi/ui/brand";

export const brand = defineBrand({
  colors: { brand: "oklch(0.51 0.23 277)", brandOnDark: "oklch(0.72 0.16 277)" },
  fonts: { sans: "Geist, system-ui, sans-serif" },
});

// src/hooks.server.ts: the first paint already wears the brand
import { brandStyle } from "@heyramzi/ui/brand";
import { brand } from "$lib/brand";

export const handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) =>
      html.replace("<html", \`<html style="\${brandStyle(brand)}"\`),
  });`;

const mode = `<script lang="ts">
  import { ThemeProvider } from "@heyramzi/ui/components/theme";
  let { children } = $props();
</script>

<ThemeProvider />
{@render children()}`;

/** The one line that adds the docs MCP server to Claude Code, shared with `/llms.txt`. */
export const mcpInstall = "claude mcp add --transport http heyramzi-ui https://ui.heyramzi.com/mcp";

const agentFiles = `curl https://ui.heyramzi.com/llms.txt
curl https://ui.heyramzi.com/components/tabs.md
curl https://ui.heyramzi.com/registry.json`;

export const docBlocks: DocBlock[] = [
  {
    id: "install",
    title: "Installation",
    steps: [
      { label: "Add the package", lang: "bash", code: install },
      { label: "Load the tokens in app.css", lang: "css", code: css },
      { label: "Import a part by its path", lang: "svelte", code: usage },
    ],
  },
  {
    id: "theming",
    title: "Theming",
    steps: [
      { label: "Name your brand once", lang: "typescript", code: brand },
      { label: "Mount light and dark once, in the root layout", lang: "svelte", code: mode },
    ],
  },
  {
    id: "agents",
    title: "Coding agents",
    steps: [
      { label: "Add the MCP server to Claude Code", lang: "bash", code: mcpInstall },
      { label: "Or read the docs as text", lang: "bash", code: agentFiles },
    ],
  },
];

export const peersTitle = "Add these only for the parts that use them";

/** Optional peer packages, each with the parts that need it. */
export const peers: [name: string, part: string][] = [
  ["svelte-sonner", "Toasts"],
  ["mode-watcher", "Toasts and the theme provider"],
  ["@internationalized/date", "Calendar"],
  ["@xyflow/svelte", "Canvas"],
];

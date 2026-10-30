---
paths:
  - "**/*.svelte"
  - "**/*.svelte.ts"
  - "**/*.svelte.js"
  - "**/svelte.config.js"
  - "**/kit.config.js"
  - "**/src/routes/**"
---
<!-- vibekit:rule -->
<!-- Generated from vibe-kit/ai-doc/rules/. Edit there, then run: node vibe-kit/ai-doc/scripts/sync-agents-core.cjs -->

# Svelte and SvelteKit

**Load the skill before you read further into the code.** A page's layout, audit, spacing or polish is `ui-design`. An animation is `transitions-dev`. Runes, markup and the toolchain are `svelte-standards`. On 30 Oct 2026 the routing eval sent "audit the clients page" straight into the code, and it never loaded `ui-design` in 6 turns.

Each of these failed silently at least once. The story behind each is in the `svelte-standards` skill's `references/traps.md`.

- **A duplicate `{#each}` key kills the whole subtree**, not one row: 221 tiles turned into dead buttons. Key on a real unique id, and read the console before you reason about a click.
- **A loop variable that shadows a `$derived` name renders `[object Object]`**, with no warning from Svelte or svelte-check.
- **An array filled by `bind:this` in a loop is `$state([])`**, not a plain array.
- **Render a snippet with `{@render name()}`.** `<Name />` throws `invalid_snippet_arguments`.
- **A `draggable` ancestor eats the click of everything under it.** Mark controls `data-no-drag` and cancel `dragstart` on them.
- **A cross-origin `redirect()` needs `{ external: true }` in SvelteKit 3**, or it throws `redirect_external_not_allowed` and the visitor gets a 500. From the SvelteKit 3 move until 7 Oct 2026, the bare `upsys-consulting.com` and the Stripe upgrade checkout both answered 500.
- **Adapter-cloudflare 8 passes no `platform`, and Kit 3 exposes only env vars declared in `src/env.ts`.** Read a Worker secret with `import { NAME } from "$app/env/private"` after declaring it. `platform?.env?.STRIPE_SECRET_KEY` built to a constant `undefined`, and checkout on ClickUp, Airtable and Asana to Sheets answered 500 until 21 Oct 2026.
- **A layout `load` gates pages, never a sibling `+server.ts`.** Every endpoint enforces its own auth.
- **A route param that holds a storage key with a slash is a rest param**, `[...key]`, or every nested key 404s.
- **A shared piece of layout (a footer, a nav) is one component every page uses.** Two footers drift apart.
- **Set a prop's default once, in the destructuring.** A second fallback in the markup is two places to update.
- **`pnpm build` passes a Cloudflare asset over 25 MiB; only `wrangler`/`vite preview` refuses it.** A bundled onnxruntime wasm (25.6 MiB) would have failed the deploy (30 Sep 2026). Load heavy ML runtimes from a CDN at runtime.
- **A `class` passed to a component never gets the parent's scoped CSS.** A `.spin` on Lucide icons read as unused and the spinners never turned. Use `:global(.name)`.
- **The UI never explains itself.** No sentence under a heading, no intro saying what a section or a term is, no note on why a list is laid out the way it is. Labels, counts and layout carry it. Ramzi, 4 Oct 2026: *"UI is self explanatory, UI should not be described."* The voice rule's "show the thinking" is for prose, never for an interface string.

Runes, section order and the toolchain: the `svelte-standards` skill.

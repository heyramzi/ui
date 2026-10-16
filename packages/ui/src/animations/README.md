# @heyramzi/ui — animations

Production-ready CSS transitions adapted from **[transitions.dev](https://transitions.dev)** by [Jakub Antalík](https://github.com/Jakubantalik) ([source](https://github.com/Jakubantalik/transitions.dev)).

The whole free catalogue is here. The paid ones are not, and are never vendored — Ramzi, 14 Sep 2026: "the pro effects we don't need them".

## Staying in sync

```bash
pnpm sync:transitions          # fetch upstream, vendor it, report what moved
pnpm sync:transitions --check  # fail if upstream moved (CI / pre-release)
```

The script writes pristine upstream copies to `.upstream/transitions/` and hashes them in `.upstream/transitions.lock.json`. It never touches these files: `git diff .upstream/` is the upstream changelog, and porting a change is a decision. `PORTED` in `scripts/sync-transitions.mjs` maps each upstream slug to its home here, and the script reports any slug that has none.

## What's here

| File | Selector | Used by |
| --- | --- | --- |
| `avatar-group-hover.css` | `.t-avatar-group`, `.t-avatar` | standalone |
| `card-tilt.css` | `.t-tilt`, `.t-tilt-card`, `.t-tilt-glare` | standalone |
| `digit-pop-in.css` | `.t-digit` | standalone |
| `dropdown.css` | `.t-dropdown` | `shadcn/tooltip`, `dropdown-menu`, `popover`, `context-menu` and `select` content |
| `input-clear-dissolve.css` | `.t-clear`, `.t-clear-mirror`, `.t-clear-glow` | standalone |
| `input-shake.css` | `.t-input-wrap`, `.t-input`, `.t-error-msg` | (none, form layer moved to upsys) |
| `learn-more-hover.css` | `.t-learn`, `.t-learn-chevron` | standalone |
| `like-button.css` | `.t-like`, `.t-like-particles` | standalone |
| `modal.css` | `.t-modal`, `.t-modal-backdrop` | `shadcn/dialog`, `shadcn/alert-dialog` |
| `page-side-by-side.css` | `.t-page` | standalone |
| `plus-menu-morph.css` | `.t-morph`, `.t-morph-plus`, `.t-morph-menu` | standalone |
| `resize.css` | `.t-resize` | standalone |
| `shimmer-text.css` | `.t-shimmer` | `thinking-states.css` |
| `spinning-counter.css` | `.t-reel`, `.t-reel-col` | standalone |
| `success-check.css` | `.t-success-check` | standalone |
| `text-swap.css` + `text-swap.ts` | `.t-text-swap` | standalone |
| `thinking-states.css` | `.t-think`, `.t-think-text` | standalone |

`index.css` is the barrel — imports all of the above.

## Fifteen upstream transitions that are not files here

One behaviour, one implementation. Where a component already did the job, the upstream recipe was merged into it or dropped, rather than shipped as a second way to do the same thing.

| Upstream | Where it lives instead |
| --- | --- |
| `toggle` | `shadcn/switch/switch.svelte` — the thumb slide, on our switch. |
| `checkbox-check` | `shadcn/checkbox/checkbox.svelte` — the fill and border, on our checkbox. |
| `toast-open-close` | `shadcn/sonner` — svelte-sonner owns toast motion. |
| `banner-stacking` | `shadcn/sonner` — stacking and hover spread are what it does. |
| `matrix-dot-loader` | `ai/loading-state` — `PixelLoader` is the dot-grid loader. |
| `tabs-sliding` | `shadcn/tabs/tabs-list.svelte` with `lib/sliding-pill.ts` — the pill slides under the active tab. |
| `tooltip-open-close` | `shadcn/tooltip/tooltip-content.svelte` — wired through `.t-dropdown`. |
| `accordion` | `shadcn/accordion/accordion-content.svelte` — the expand and collapse keyframes. |
| `skeleton-loader-and-reveal` | `shadcn/skeleton/skeleton.svelte` — the pulse. |
| `notification-badge` | `shadcn/badge/badge.svelte` — the badge. |
| `reasoning-stream` | `ai/reasoning/ReasoningContent.svelte` — the reasoning body. |
| `streaming-text` | `effects/reveal/TextEffect.svelte` — word by word with a blur. |
| `texts-reveal` | `effects/reveal/TextEffect.svelte` — the staggered rise. |
| `panel-reveal` | `shadcn/sheet/sheet.css` — the sheet slide, imported by the sheet itself. |
| `icon-swap` | `effects/theme-toggle/ThemeToggle.svelte` — the sun, moon and monitor icons cross-fade. |

One more pair looks like a duplicate and is not: `spinning-counter` rolls a number between values, `digit-pop-in` updates one in place.

## How to consume

These styles are **not** auto-loaded with the components. Consumers import them once:

```css
@import "@heyramzi/ui/animations";
```

The two merged into components are the exception — `switch.svelte` and `checkbox.svelte` import their own CSS, so they animate with no consumer action.

## Tunable tokens

Every transition reads semantic CSS variables (`--modal-open-dur`, `--tilt-follow`, `--think-swap`). Where the shared motion scale in `@heyramzi/ui/design` has a token at that exact value, the variable defaults to it and keeps the literal as the fallback:

```css
--toast-open: var(--duration-medium, 350ms);
```

So the scale is single-sourced when the design layer is imported, and the transition still runs at the shipped value when it is not. A value the scale has no token for — a 1000ms tilt return, a 90ms reel stagger — stays a literal rather than being rounded onto the nearest rung. Override any of them at `:root` or per-scope to retune without forking the CSS.

See the `transitions-dev` skill in vibe-kit (`ai-doc/skills/design/motion/transitions-dev/SKILL.md`) for the full token list and the per-transition variables.

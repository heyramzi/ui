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
| `accordion.css` | `.t-acc` | standalone |
| `avatar-group-hover.css` | `.t-avatar-group`, `.t-avatar` | standalone |
| `card-tilt.css` | `.t-tilt`, `.t-tilt-card`, `.t-tilt-glare` | standalone |
| `digit-pop-in.css` | `.t-digit` | standalone |
| `dropdown.css` | `.t-dropdown` | (not yet wired) |
| `icon-swap.css` | `.t-icon-swap` | standalone |
| `input-clear-dissolve.css` | `.t-clear`, `.t-clear-mirror`, `.t-clear-glow` | standalone |
| `input-shake.css` | `.t-input-wrap`, `.t-input`, `.t-error-msg` | (none, form layer moved to upsys) |
| `learn-more-hover.css` | `.t-learn`, `.t-learn-chevron` | standalone |
| `like-button.css` | `.t-like`, `.t-like-particles` | standalone |
| `modal.css` | `.t-modal`, `.t-modal-backdrop` | `shadcn/dialog`, `shadcn/alert-dialog` |
| `notification-badge.css` | `.t-badge` | standalone |
| `page-side-by-side.css` | `.t-page` | standalone |
| `panel.css` | `.t-panel` | (not yet wired) |
| `plus-menu-morph.css` | `.t-morph`, `.t-morph-plus`, `.t-morph-menu` | standalone |
| `reasoning-stream.css` | `.t-reason`, `.t-reason-viewport` | standalone |
| `resize.css` | `.t-resize` | standalone |
| `shimmer-text.css` | `.t-shimmer` | `thinking-states.css` |
| `skeleton-reveal.css` | `.t-skel` | standalone |
| `spinning-counter.css` | `.t-reel`, `.t-reel-col` | standalone |
| `streaming-text.css` | `.t-stream-w` | standalone |
| `success-check.css` | `.t-success-check` | standalone |
| `tabs-sliding.css` | `.t-tabs`, `.t-tab`, `.t-tabs-pill` | standalone |
| `text-swap.css` + `text-swap.ts` | `.t-text-swap` | standalone |
| `texts-reveal.css` | `.t-stagger`, `.t-stagger-line` | standalone |
| `thinking-states.css` | `.t-think`, `.t-think-text` | standalone |
| `tooltip.css` | `.t-tt-wrap`, `.t-tt`, `.t-tt-trigger` | standalone |

`index.css` is the barrel — imports all of the above.

## Five upstream transitions that are not files here

One behaviour, one implementation. Where a component already did the job, the upstream recipe was merged into it or dropped, rather than shipped as a second way to do the same thing.

| Upstream | Where it lives instead |
| --- | --- |
| `toggle` | `shadcn/switch/switch.svelte` — the thumb slide, on our switch. |
| `checkbox-check` | `shadcn/checkbox/checkbox.svelte` — the fill and border, on our checkbox. |
| `toast-open-close` | `shadcn/sonner` — svelte-sonner owns toast motion. |
| `banner-stacking` | `shadcn/sonner` — stacking and hover spread are what it does. |
| `matrix-dot-loader` | `ai/loading-state` — `PixelLoader` is the dot-grid loader. |

Two more pairs look like duplicates and are not: `spinning-counter` rolls a number between values, `digit-pop-in` updates one in place; `streaming-text` resolves a paragraph word by word, `ai/response` only blinks a caret while `.is-streaming`.

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

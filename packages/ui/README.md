# @heyramzi/ui

Svelte 5 UI primitives you copy into your project and own. Components, visual
effects, CSS animations, charts and a small set of chat and AI surfaces. No build step, no runtime wrapper,
no framework lock-in.

The package is a source registry. Every component is a folder under
`src/` that you can copy into your own `$lib` and edit. The root barrel is
only a convenience.

## What is inside

- `src/shadcn` shadcn-svelte primitives, generalized.
- `src/effects` animated borders, beams, marquee, spotlight, image reveal,
  image comparison, shimmer gradients and a theme toggle.
- `src/animations` keyframe CSS for dropdowns, modals, tooltips, text swaps,
  success checks and the rest of the motion vocabulary.
- `src/ai` chat and AI surfaces: conversation, composer, prompt input, response, reasoning, confirmation and loaders.
- `src/charts` SVG charts: line, area, bar, donut, ring, gauge, sparkline,
  time series, and stat cards.

See [COMPONENTS.md](./COMPONENTS.md) for the full list, one line each.

## Setup

Import the style layer once, after Tailwind:

```css
@import "tailwindcss";
@import "@heyramzi/ui/tokens.css";
@import "@heyramzi/ui/animations";
```

`tokens.css` carries the palette, the semantic tokens and the craft layer
(radius, elevation, focus, motion). `animations` carries the keyframes the
components reference. If you use the Attachment or Message component, also
import `@heyramzi/ui/shadcn/utilities.css`.

Retheme by overriding any variable on `:root`, for example
`--color-brand-indigo` or `--radius-lg`. Dark mode keys off a `.dark`
class on `html`.

React and other framework ports are out of scope. The source is Svelte 5
runes only.

## Using a component

Import from a subpath:

```svelte
<script lang="ts">
  import { Button } from "@heyramzi/ui/shadcn/button";
  import { Card, CardHeader, CardTitle, CardContent } from "@heyramzi/ui/shadcn/card";
  import Marquee from "@heyramzi/ui/effects/marquee/Marquee.svelte";
</script>
```

Many components take their content through snippets, so you keep full control:

```svelte
<Button variant="outline" size="sm" onclick={save}>Save</Button>
```

## shadcn-svelte

The primitives in `src/shadcn` are copies of
[shadcn-svelte](https://shadcn-svelte.com), generalized. If a component exists
there, use its page for props and examples:

| Component | Docs |
| --- | --- |
| `accordion` | https://shadcn-svelte.com/docs/components/accordion |
| `alert` | https://shadcn-svelte.com/docs/components/alert |
| `alert-dialog` | https://shadcn-svelte.com/docs/components/alert-dialog |
| `attachment` | https://shadcn-svelte.com/docs/components/attachment |
| `avatar` | https://shadcn-svelte.com/docs/components/avatar |
| `badge` | https://shadcn-svelte.com/docs/components/badge |
| `breadcrumb` | https://shadcn-svelte.com/docs/components/breadcrumb |
| `bubble` | https://shadcn-svelte.com/docs/components/bubble |
| `button` | https://shadcn-svelte.com/docs/components/button |
| `calendar` | https://shadcn-svelte.com/docs/components/calendar |
| `card` | https://shadcn-svelte.com/docs/components/card |
| `checkbox` | https://shadcn-svelte.com/docs/components/checkbox |
| `collapsible` | https://shadcn-svelte.com/docs/components/collapsible |
| `command` | https://shadcn-svelte.com/docs/components/command |
| `context-menu` | https://shadcn-svelte.com/docs/components/context-menu |
| `dialog` | https://shadcn-svelte.com/docs/components/dialog |
| `dropdown-menu` | https://shadcn-svelte.com/docs/components/dropdown-menu |
| `empty` | https://shadcn-svelte.com/docs/components/empty |
| `field` | https://shadcn-svelte.com/docs/components/field |
| `hover-card` | https://shadcn-svelte.com/docs/components/hover-card |
| `input` | https://shadcn-svelte.com/docs/components/input |
| `input-otp` | https://shadcn-svelte.com/docs/components/input-otp |
| `label` | https://shadcn-svelte.com/docs/components/label |
| `marker` | https://shadcn-svelte.com/docs/components/marker |
| `message` | https://shadcn-svelte.com/docs/components/message |
| `popover` | https://shadcn-svelte.com/docs/components/popover |
| `progress` | https://shadcn-svelte.com/docs/components/progress |
| `radio-group` | https://shadcn-svelte.com/docs/components/radio-group |
| `scroll-area` | https://shadcn-svelte.com/docs/components/scroll-area |
| `select` | https://shadcn-svelte.com/docs/components/select |
| `separator` | https://shadcn-svelte.com/docs/components/separator |
| `sheet` | https://shadcn-svelte.com/docs/components/sheet |
| `sidebar` | https://shadcn-svelte.com/docs/components/sidebar |
| `skeleton` | https://shadcn-svelte.com/docs/components/skeleton |
| `slider` | https://shadcn-svelte.com/docs/components/slider |
| `sonner` | https://shadcn-svelte.com/docs/components/sonner |
| `spinner` | https://shadcn-svelte.com/docs/components/spinner |
| `switch` | https://shadcn-svelte.com/docs/components/switch |
| `table` | https://shadcn-svelte.com/docs/components/table |
| `tabs` | https://shadcn-svelte.com/docs/components/tabs |
| `textarea` | https://shadcn-svelte.com/docs/components/textarea |
| `toggle` | https://shadcn-svelte.com/docs/components/toggle |
| `toggle-group` | https://shadcn-svelte.com/docs/components/toggle-group |
| `tooltip` | https://shadcn-svelte.com/docs/components/tooltip |

## Credits

Inspired by [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte).
The reveal, marquee and beam effects are inspired by
[motion-primitives](https://github.com/ibelick/motion-primitives), and the
motion vocabulary by [transitions-dev](https://transitions.dev).

## License

MIT

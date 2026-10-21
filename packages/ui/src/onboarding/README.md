# @heyramzi/ui/onboarding

Svelte 5 page tours. A dimmed page, one lit element and a short card per step, shown once per page and
remembered per person. Live at [ui.heyramzi.com/onboarding](https://ui.heyramzi.com/onboarding).

It builds on [`@zag-js/tour`](https://zagjs.com/components/svelte/tour) (MIT) for spotlight geometry, focus and
keys, and draws the card itself with the rest of `@heyramzi/ui`, so it looks like the rest of your app.
`phosphor-svelte` and `svelte` are peers.

```
pnpm add @heyramzi/ui phosphor-svelte
```

## Define the tours

A tour belongs to a SvelteKit route id, so params never matter. `steps` points at elements by CSS selector. `intro`
is one centred card with no target, for a page's first visit.

```ts
import { defineTours } from "@heyramzi/ui/onboarding";

export const tours = defineTours([
  {
    id: "home",
    route: "/(app)",
    kind: "intro",
    title: "The week in one place",
    body: "Open work sits on the left. Anything late floats to the top.",
  },
  {
    id: "projects-board",
    version: 1,
    route: "/(app)/projects",
    kind: "steps",
    steps: [
      { target: '[data-tour="new-project"]', title: "Start here", body: "A name and a client. That's all." },
    ],
  },
]);
```

`defineTours` throws on a repeated id, a route that isn't a route id, and a `steps` tour with fewer than 1 or more
than 6 steps. Past 6, people skip.

## Mount it once

Put the provider in the root layout, next to the page slot.

```svelte
<script lang="ts">
  import { page } from "$app/state";
  import { OnboardingProvider, localStorageStore } from "@heyramzi/ui/onboarding";
  import { tours } from "$lib/tours";

  const strings = {
    next: "Next",
    back: "Back",
    done: "Got it",
    skip: "Skip the tour",
    progress: (n: number, total: number) => `Step ${n} of ${total}`,
  };
</script>

<OnboardingProvider {tours} store={localStorageStore()} {strings} routeId={page.route.id} />
```

On every navigation it picks the first unseen tour for the route, waits up to 2 seconds for the first step's target,
drops steps whose target never shows, and starts. A tour with no target on the page starts nothing. One tour per page
view, never two stacked. Strings are yours, so translate them before you pass them in.

| Prop | Default | |
| --- | --- | --- |
| `tours` | | From `defineTours`. |
| `store` | | A `SeenStore`. |
| `strings` | | `next`, `back`, `done`, `skip`, `progress(n, total)`. |
| `routeId` | | `page.route.id`. |
| `enabled` | `true` | Set `false` while signed out. |
| `replayKey` | `true` | Press `?` to replay. |
| `waitMs` | `2000` | How long to wait for the first target. |

## Replay

```ts
import { onboarding } from "@heyramzi/ui/onboarding";

onboarding.replay();          // this page's tour
onboarding.replay("home");    // a named tour
onboarding.hasTour;           // true when this page has one
```

Replay writes no seen-state. `onboarding.hasTour` is reactive, so a "Show me around" menu item can hide itself on
pages without a tour.

## Seen-state

`SeenStore` is three methods. `load` runs once per session and returns tour id to the version seen.

```ts
interface SeenStore {
  load(): Promise<Record<string, number>>;
  markSeen(tourId: string, version: number, outcome: "completed" | "dismissed"): Promise<void>;
  reset(tourId?: string): Promise<void>;
}
```

The store keeps a version, not a boolean. Raise a tour's `version` after the page changes and everyone sees it
again. `localStorageStore(key?)` and `memoryStore(initial?)` come with the package and also live at
`@heyramzi/ui/onboarding/stores`. Server stores belong in the app: a table keyed by user and tour id, and a `fetch`
adapter.

If `load` rejects, no tour shows that session.

## Phones and motion

Under 640px every step is a bottom sheet over the page, and the target scrolls above it. With
`prefers-reduced-motion` the spotlight and card stop animating.

## License

MIT

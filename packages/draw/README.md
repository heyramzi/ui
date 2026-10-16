# @heyramzi/draw

A whiteboard engine for Svelte 5. Hand-drawn shapes, freehand ink and your own Svelte components share one canvas, and the core runs on a server with no browser.

It's MIT. tldraw needs a paid license key in production since SDK 4.0, and Excalidraw is React only. This one is plain TypeScript at the core and Svelte 5 at the edge.

## Features

- Freehand ink smoothed by `perfect-freehand`. A pen's pressure changes the width, and a mouse stroke stays even.
- Select, move, resize and rotate any shape the same way. Shift keeps the aspect ratio, alt resizes from the center, and everything undoes.
- Arrows that bind to shapes and follow them when they move.
- Any Svelte component as a shape, through the node adapter.
- One hand-drawn look, seeded by shape id, so the wobble is the same on the server and in the browser. `style="clean"` turns it off.
- Light and dark.

## Install

```sh
pnpm add @heyramzi/draw
```

Svelte 5 is a peer dependency.

## Use it

```svelte
<script lang="ts">
  import { createEditor, Draw, Toolbar, installArrowSideEffects } from "@heyramzi/draw";

  const editor = createEditor();
  installArrowSideEffects(editor);
</script>

<div style="position: fixed; inset: 0">
  <Draw {editor} />
  <Toolbar {editor} />
</div>
```

`installArrowSideEffects` is what keeps a bound arrow attached when the shape it points at moves. Skip it and arrows stay where you drew them.

`<Draw>` takes `editor`, and optionally `nodes`, `style` (`"hand"` or `"clean"`), `dark` and `class`.

## Save and load

The editor keeps every record in a store. Save its snapshot, and pass it back to open the page again:

```ts
import { createEditor, migrate } from "@heyramzi/draw";

const editor = createEditor({ snapshot: migrate(JSON.parse(saved)) });

const stop = editor.getStore().subscribe(() => {
  localStorage.setItem("board", JSON.stringify(editor.getStore().snapshot()));
});
```

`migrate` takes a snapshot from any older schema version, brings it up to date and checks it. Debounce the save in a real app, since the store reports every change during a drag.

## Your components as shapes

A `node` shape renders whatever component you register for its kind. The component gets `id`, `data`, `selected`, `width` and `height`:

```svelte
<script lang="ts">
  import { createEditor, defineNodes, Draw } from "@heyramzi/draw";
  import Card from "./Card.svelte";

  const editor = createEditor();
  const nodes = defineNodes({ card: Card });

  editor.createShape({
    type: "node",
    x: 100,
    y: 100,
    w: 240,
    h: 140,
    props: { kind: "card", data: { title: "Hello" } },
  });
</script>

<Draw {editor} {nodes} />
```

A kind with no component draws a labeled box, so a missing registration is visible on the canvas and nothing throws. A component that throws is caught by its own error boundary, and the rest of the board keeps working.

## Headless

Everything under `@heyramzi/draw/core` is plain TypeScript, with no Svelte and no DOM. Load a snapshot, edit it through the same editor the canvas uses, and export SVG on a server:

```ts
import { createEditor, exportSvg, migrate } from "@heyramzi/draw/core";

const editor = createEditor({ snapshot: migrate(raw) });
editor.createShape({ type: "rect", x: 0, y: 0, w: 200, h: 120 });

const svg = exportSvg(editor.getStore().snapshot(), { style: "hand" });
```

Node shapes export as labeled boxes, because their components can't run without a browser.

Tools are state machines driven by events, so a test can script a whole gesture:

```ts
editor.dispatch({ type: "pointer_down", input: { /* ... */ } });
```

The package's own tool tests show the full event shape.

## Shapes

`rect`, `ellipse`, `diamond`, `line`, `arrow`, `text`, `note`, `frame`, `image`, `freehand` and `node`. A util per type holds its defaults, bounds, hit-testing, resize and `toSvg`. Pass your own to `createEditor({ shapes })`.

## Keys

`v` select, `h` hand, `p` pen, `r` rect, `o` ellipse, `d` diamond, `l` line, `a` arrow, `t` text, `n` note, `f` frame, `e` eraser. Space or the middle button pans. Ctrl and the wheel, or a trackpad pinch, zooms on the cursor. Double-click text, a note or a frame label to edit it.

## Not in v1

Real-time multiplayer. The store holds flat records and emits diffs, so a sync adapter can sit on top later.

## License

MIT

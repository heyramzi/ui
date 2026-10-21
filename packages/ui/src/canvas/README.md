# @heyramzi/ui/canvas

A canvas for Svelte 5 and SvelteKit, built on [@xyflow/svelte](https://svelteflow.dev). Cards and arrows from xyflow, a hand-drawing pen on top, and a plugin API for your own card types.

Strokes, text and shapes are ordinary xyflow nodes. So undo, copy and save work with no extra code. The same ops run on a server or in a CLI, with no browser.

MIT. It runs on any domain and costs nothing per install.

## What's in it

- **Pen layer.** Freehand strokes (perfect-freehand), a highlighter, an eraser, plain text, and rectangle, ellipse and diamond shapes. Colours are token names, so a board drawn in light mode reads fine in dark.
- **Tool bar.** A floating bar with the tools, undo and redo. Pick from 6 colours and 3 brush sizes. Keys: V, H, P, M, E, T, R, O, D.
- **Plugin API.** Register your own card types, ops and layout passes. One registry builds xyflow's `nodeTypes` for you.
- **Ops.** 8 core ops (`addNode`, `removeNode`, `patchNode`, `moveNode`, `setParent`, `addEdge`, `removeEdge`, `patchEdge`) as plain functions over nodes and edges. Zod checks every one.
- **Undo history.** `createCanvasDispatcher` wraps each edit in a transaction. A whole pen stroke is one undo step.
- **Headless.** Everything that doesn't need a DOM, for servers and CLIs.

## Install

```sh
npm install @heyramzi/ui @xyflow/svelte svelte
```

Peers: `svelte` ^5.57.2 and `@xyflow/svelte` ^1.7.0. The canvas is the one subpath whose peer you add yourself.

The package ships Svelte source, so your app needs `@sveltejs/vite-plugin-svelte`. A SvelteKit app has it already.

## Use it in SvelteKit

Drop this in `src/routes/+page.svelte`.

```svelte
<script lang="ts">
  import { Background, SvelteFlow, type Edge, type Node } from "@xyflow/svelte";
  import "@xyflow/svelte/dist/style.css";
  import { createCanvasDispatcher, createRegistry } from "@heyramzi/ui/canvas";
  import { penUiPlugin } from "@heyramzi/ui/canvas/pen/ui.js";
  import type { PenColor } from "@heyramzi/ui/canvas/pen/index.js";
  import {
    brushSize,
    DEFAULT_BRUSH_LEVEL,
    isDrawingTool,
    type CanvasTool,
  } from "@heyramzi/ui/canvas/ui/tools.js";
  import CanvasToolbar from "@heyramzi/ui/canvas/ui/CanvasToolbar.svelte";
  import PenLayer from "@heyramzi/ui/canvas/ui/PenLayer.svelte";

  const registry = createRegistry([penUiPlugin]);

  let nodes = $state.raw<Node[]>([]);
  let edges = $state.raw<Edge[]>([]);
  let tool = $state<CanvasTool>("select");
  let color = $state<PenColor>("ink");
  let level = $state(DEFAULT_BRUSH_LEVEL);

  const history = createCanvasDispatcher({
    getState: () => ({ nodes, edges }),
    setState: (next) => {
      nodes = next.nodes;
      edges = next.edges;
    },
    // Save here. It fires once per commit, undo and redo.
    onMutated: () => {},
    opDefinitions: [...registry.ops.values()],
  });

  const labels = {
    toolbar: "Canvas tools",
    style: "Style",
    tools: {
      select: "Select", hand: "Hand", pen: "Pen", highlighter: "Highlighter",
      eraser: "Eraser", text: "Text", rectangle: "Rectangle", ellipse: "Ellipse",
      diamond: "Diamond", shapes: "Shapes",
    },
    colors: { ink: "Ink", red: "Red", blue: "Blue", green: "Green", amber: "Amber", violet: "Violet" },
    sizes: ["Small", "Medium", "Large"],
    undo: "Undo",
    redo: "Redo",
  } as const;
</script>

<div style="height: 100vh">
  <SvelteFlow bind:nodes bind:edges nodeTypes={registry.nodeTypes()} fitView>
    <Background />
    {#if isDrawingTool(tool)}
      <PenLayer
        {tool}
        {color}
        size={brushSize(tool, level)}
        {nodes}
        commit={(ops) => history.dispatch(ops)}
        startGesture={() => {
          history.begin();
          return history.commit;
        }}
      />
    {/if}
    <CanvasToolbar
      bind:tool
      bind:color
      bind:level
      {labels}
      canUndo={history.canUndo}
      canRedo={history.canRedo}
      onUndo={history.undo}
      onRedo={history.redo}
    />
  </SvelteFlow>
</div>
```

Pick the pen tool, drag, and you've drawn a stroke. Press undo and it's gone. The whole gesture is one step.

`PenLayer` and `CanvasToolbar` both read xyflow's store, so they go inside `<SvelteFlow>`. The tool bar takes a `labels` object because the package has no i18n. Pass your own strings.

Components import by path:

- `@heyramzi/ui/canvas/ui/CanvasToolbar.svelte`
- `@heyramzi/ui/canvas/ui/PenLayer.svelte`
- `@heyramzi/ui/canvas/ui/canvas-grid.svelte`, a dot grid that fades as you zoom out

The tool bar's styles read your theme tokens (`--card`, `--border`, `--foreground`, `--ring`) and fall back to plain colours when you have none.

## The plugin API

A plugin is a name plus node kinds, ops and layout passes. Write it once for the server, then add the Svelte component for the browser. That's how the pen does it: `penPlugin` has no DOM, and `penUiPlugin` adds the renderers.

```ts
// invoice-plugin.ts, safe on a server
import { z } from "zod";
import { definePlugin, patchData, type OpState } from "@heyramzi/ui/canvas";

const setTotal = z.object({
  kind: z.literal("setTotal"),
  nodeId: z.string().min(1),
  total: z.number(),
});

function applySetTotal(state: OpState, op: z.infer<typeof setTotal>, opIndex: number) {
  patchData(state, op.nodeId, opIndex, () => ({ total: op.total }));
}

export const invoicePlugin = definePlugin({
  id: "invoice",
  nodes: [
    {
      type: "invoice",
      label: "Invoice",
      size: { width: 240 },
      palette: { group: "Billing", order: 1 },
      createData: () => ({ total: 0 }),
    },
  ],
  ops: [
    { kind: "setTotal", schema: setTotal, apply: applySetTotal },
  ],
});
```

```ts
// invoice-ui.ts, browser only
import { definePlugin } from "@heyramzi/ui/canvas";
import InvoiceCard from "./InvoiceCard.svelte";
import { invoicePlugin } from "./invoice-plugin";

export const invoiceUiPlugin = definePlugin({
  ...invoicePlugin,
  nodes: (invoicePlugin.nodes ?? []).map((kind) => ({ ...kind, component: InvoiceCard })),
});
```

Then `createRegistry([penUiPlugin, invoiceUiPlugin])` gives you:

- `nodeTypes()`, the map xyflow wants.
- `ops`, to pass as `opDefinitions` to the dispatcher or `applyOps`.
- `parseOp(input)`, which checks one op against its kind's schema.
- `pickLayout(data)`, the first layout pass whose `matches` says yes.
- `contentSizedTypes()` and `layoutOwnedTypes()`, so a layout knows which heights the DOM owns.

A node type or op kind can have only one owner. If a second plugin claims one, `createRegistry` throws and names both.

A node kind can also set `validParents` (which containers it may sit in) and `sizing`. A layout pass is `{ id, matches, run }`, and `run` returns the new nodes and edges.

## The pen

A stroke is a node with `type: "stroke"`. Its `data` holds the simplified points, a colour token, a size and a tool. Text is `"text"` and a shape is `"shape"`. They're real nodes, so the eraser, selection, copy and your save code treat them like cards.

The pen is `PenOverlay` (or `PenLayer` inside xyflow), and it needs 2 callbacks from you:

- `commit(ops)` receives `addNode` and `removeNode` ops. Send them to `history.dispatch`.
- `startGesture()` opens an undo transaction and returns the function that closes it. A stroke is a single history step.

The eraser removes whole strokes, never part of one. A swipe across a big shape doesn't wipe it.

The pen has 6 colours: `ink`, `red`, `blue`, `green`, `amber` and `violet`. `pen.css` maps them to CSS variables with a light and a dark value. Dark mode applies under a `.dark` class on an ancestor or on `.svelte-flow`.

## Headless ops

Import from `@heyramzi/ui/canvas` on a server, in a worker or in a CLI. The root export touches no DOM.

```ts
import { applyOps, createRegistry, type RawCanvasData } from "@heyramzi/ui/canvas";
import { penPlugin } from "@heyramzi/ui/canvas/pen/index.js";
import { compilePenMark, penMarkSchema } from "@heyramzi/ui/canvas/headless/index.js";

const registry = createRegistry([penPlugin]);

let board: RawCanvasData = { nodes: [], edges: [] };

// Ops from a request body or a CLI flag. An unknown kind or a bad shape throws.
const ops = [
  { kind: "addShape", shape: "rectangle", box: { x: 0, y: 0, width: 200, height: 120 }, label: "Intake" },
  { kind: "addText", at: { x: 20, y: 160 }, text: "Where leads land" },
].map((op) => registry.parseOp(op));

board = applyOps(board, ops, [...registry.ops.values()]);
```

`applyOps` is pure. It returns a new board and never edits the one you pass. A bad op throws a `CanvasOpError` with the index of the op that failed, so you know which one in a list of 57.

For a whole drawing in one call, write pen marks as JSON. There are 3 kinds: `stroke`, `text` and `shape`. They compile to the same nodes the pen tool draws.

```ts
const marks = penMarkSchema.array().parse(JSON.parse(input));
const frames = new Map(); // frame id to { x, y }, if a mark uses `in`
const nodes = marks.map((mark, i) => compilePenMark(mark, i, frames));
board = { ...board, nodes: [...board.nodes, ...nodes] };
```

A mark with no `id` gets `pen-<n>` from its place in the list. Run the same file twice and you get the same ids.

The root export also has the pure helpers the editor uses: edge anchors, alignment, snap guides, fit-to-viewport, table layout, SVG figure sanitising and the sketch (rough.js) geometry. Import what you need.

## Develop

Tests run in jsdom, so no browser. From the repo root, `pnpm --filter @heyramzi/ui test` runs them and `pnpm --filter @heyramzi/ui check` typechecks.

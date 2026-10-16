# @heyramzi/draw: product requirements

A whiteboard engine for Svelte 5. Hand-drawn diagrams, freehand ink, and structured nodes on one canvas, with a headless core that runs on a server.

## The problem

Our diagram tool draws structured nodes well, and it has a hand-drawn layer. It can't do free ink, free arrows or a rotated stroke, because those fight the node-and-edge model under it. tldraw does all of that, but it only runs on React and, since SDK 4.0, needs a paid license key in production. Excalidraw is MIT and also React.

No Svelte 5 whiteboard engine is good enough to build a product on. So we build one.

## Open sourcing

Yes, if all of these hold.

- The gap is real. The only Svelte attempt we found is a stalled hobby port, so a headless MIT engine for Svelte 5 has no competitor.
- It costs us little extra. About half the core already lives in our diagram tool as tested code with no framework in it. Publishing adds a stable API and a README.
- We don't promise support. Small surface, MIT, issues welcome, no roadmap pledges. Only Svelte developers will care, so stars stay modest. We get credibility and a lead-engine story, and no community to run.

If one of those stops being true, we stop publishing and keep using it ourselves.

## Goals

1. Free ink that feels like tldraw: smooth strokes, pen pressure, no lag at 2,000 strokes.
2. You can select any shape and move, resize or rotate it the same way, with undo for all of it.
3. Arrows that stick to shapes and re-route when they move.
4. Our 17 structured node types render inside it **unchanged**, as custom shapes.
5. A headless core. A server can load a snapshot, run an edit and export SVG with no browser.
6. One hand-drawn look, with a `clean` switch. Same seed, same wobble, on server and client.

## Non-goals for v1

- Real-time multiplayer. The store is built for it (flat records, diffs), but the sync adapter comes later.
- Replacing the xyflow canvas in the app on day one. Both run side by side until the new one covers every node type.
- A React build. Never.

## Architecture

The package ships a core entry and a Svelte entry.

```
@heyramzi/draw/core    plain TypeScript. No svelte, no DOM, no app code.
  store      records by id: shapes, bindings. Reactive.
  history    diff-based undo and redo, with marks.
  geometry   bounds, hit-testing, transforms, snapping, alignment.
  shapes/    one util per type: defaults, bounds, hitTest, resize, toSvg.
  tools/     state machines: select, pen, shape, arrow, text, eraser, hand.
  camera     pan, zoom, page and screen conversion.
  schema     versioned snapshot and migrations.
  export     snapshot to SVG, no browser needed.

@heyramzi/draw          Svelte 5 renderer
  <Draw />   SVG layer, culled to the viewport. Pointer input, text editing overlay.
  nodes      adapter that hosts our existing node components as custom shapes.
```

Why this split: tests run without a browser, so cheap workers can write modules and a suite proves them. Server code (AI diagram generation, slide export) reuses the same shapes. Svelte runes live only at the edge.

The contracts live in `src/core/types.ts`, and that file is the source of truth. If a module needs a contract changed, it stops and says so. It doesn't bend the type.

## DRY: reuse before writing

The app's diagram code already holds most of what the core needs. We **extract and generalize** it, then the app imports it back from the package and deletes its copy. We don't write a second one.

| In the app today | Becomes | Change |
|---|---|---|
| `lib/diagram/editor/history-core.ts` | `core/history` | `Node` and `Edge` become `{ id }` records |
| `lib/diagram/sketch.ts` | `core/rough` | none; already server-safe and seeded by id |
| `lib/diagram/snap-guides.ts`, `alignment.ts` | `core/geometry` | none, or a type swap |
| `lib/diagram/edge-anchors.ts` | `core/geometry` | feeds arrow binding |
| `lib/diagram/fit-viewport.ts` | `core/camera` | drop the app viewport type |
| `lib/diagram/svg-figure.ts` | `core/figure` | none |
| `lib/diagram/render-svg.ts` | `core/export` | stops reading `NODE_REGISTRY`; shapes bring their own `toSvg` |
| 17 node components in `components/features/diagrams/nodes/` | custom shapes via the adapter | none. `NodeComponentProps` matches xyflow's `NodeProps` field for field. Only `<Handle>` changes |

Extracted modules bring their tests along. A module that moves and still passes its old tests is correct.

New work is the store, the camera and the freehand shape. Add the tool state machines and arrow bindings. Then the rotate and resize handles, and the Svelte renderer.

## Phases

A phase ends when its check passes and the output is attached.

### Phase 0: extract

Move the table's modules into `core/`. Generalize their types. The tests move with them.

- `pnpm test` is green in the package and `pnpm typecheck` is clean.
- `grep -rE "svelte|document|window" src/core` finds nothing outside comments.

### Phase 1: core

Build the store and the camera. Add the schema with its migrations. Then write the shape utils: rect, ellipse, diamond, line, text, note, frame, image and freehand.

- Each util has tests for bounds, hit-test and resize.
- A snapshot round-trips through save and load.
- Undo and redo restore a 100-step edit exactly.

### Phase 2: tools

Build select, pen, shape, arrow with binding, text, eraser and hand. Select has idle, pointing, translating, resizing, rotating and brushing states.

- Scripted pointer sequences drive each tool with no browser, and the snapshot matches what's expected.
- Escape mid-gesture leaves the store untouched.

### Phase 3: renderer

Build `<Draw />`, input, text editing and the node adapter.

- Our existing node types render in a demo page.
- `ego-browser` screenshots show the pen, a bound arrow following a moved box, and a rotated stroke.

### Phase 4: app

Add a sketch board diagram type in the app on the new engine. Then the app deletes its extracted copies.

- The app's existing diagram tests still pass.

## The polish bar

"As good as tldraw" has to be checkable, or it's a wish. It means all of these:

- Strokes are smoothed with `perfect-freehand` and respect pen pressure. A mouse stroke has constant width.
- Dragging 500 shapes holds 60 fps, and 2,000 strokes pan without a stutter. Shapes outside the viewport aren't rendered.
- A pointer that leaves the window mid-drag ends the gesture. It never sticks.
- Zoom is anchored on the cursor. Pinch works on a trackpad.
- Selection handles stay the same screen size at every zoom.
- Resizing with shift keeps the aspect ratio. Alt resizes from the center.
- Undo never records a selection change.
- Double-click any shape to edit its text in place.

Unit tests cover the logic. The feel is judged by eye in screenshots, so phase 3 ends with them.

## Open source hygiene

MIT. The README, examples and tests carry no client names, no ClickUp ids, no private paths and no UpSys-only copy. The app's own node components stay in the app. The package ships only the adapter that hosts them.

## Assumptions

- **Coexist, don't replace.** Chosen because the app's editor engine is about 6,500 lines tied to xyflow. If phase 3 shows the new canvas can host every node, phase 4 can replace it.
- **No multiplayer in v1.** Records and diffs keep the door open.
- **Hand style by default, `clean` as a switch.** The app already has `formal` versus drawn, so this matches it.
- **Developed in the vibe-kit repo (now `ui/packages/draw`).** At launch it moves to its own public repo with history, so open source issues don't land in vibe-kit.

# Plan 003: A canvas rebase survives deleting a card that has an arrow

> **Executor**: follow the steps in order. Run each verification and confirm the expected result
> before the next step. If a STOP condition occurs, stop and report; don't improvise. Update this
> plan's row in `plans/README.md` when done, unless a reviewer dispatched you and keeps the index.
>
> **Drift check, first**: `git diff --stat 14bdba4..HEAD -- packages/ui/src/canvas/editor/rebase.ts packages/ui/src/canvas/editor/rebase.test.ts`.
> If an in-scope file changed, compare "Current state" against the live code. A mismatch is a STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `14bdba4`, 2026-11-09
- **Ticket**: TSK-2143, step 3

## Why this matters

`rebaseDiagram` replays a user's local canvas edits on top of a newer server copy, so a save that
lost a race (an agent wrote first) merges instead of showing a conflict. It returns `null` when
the replay throws. Today it always throws when the local edit deleted a card that had an arrow:
the diff emits `removeNode`, which already removes that card's arrows, and then `removeEdge` for
the same arrows, which fails with "Unknown edgeId". It also throws when both sides deleted the
same card or arrow. The upsys diagram editor calls this in its save queue, so those users get a
conflict for a change that merges cleanly.

## Current state

- `packages/ui/src/canvas/editor/rebase.ts`: `diffToOps(base, current)` and
  `rebaseDiagram(serverDoc, lastSaved, local)`. The only source file to change.
- `packages/ui/src/canvas/ops/ops.ts`: `applyOps` and the op implementations. Read-only here.
- `packages/ui/src/canvas/editor/rebase.test.ts`: the tests to extend.

`rebase.ts:109-114`, node removals:

```ts
function nodeOps(base: DiagramDoc, current: DiagramDoc): CanvasOp[] {
  const baseNodes = new Map(base.nodes.map((n) => [n.id, n]));
  const currentIds = new Set(current.nodes.map((n) => n.id));
  const removed: CanvasOp[] = base.nodes
    .filter((n) => !currentIds.has(n.id))
    .map((n) => ({ kind: "removeNode", nodeId: n.id }));
```

`rebase.ts:164-169`, edge removals:

```ts
function edgeOps(base: DiagramDoc, current: DiagramDoc): CanvasOp[] {
  const baseEdges = new Map(base.edges.map((e) => [e.id, e]));
  const currentIds = new Set(current.edges.map((e) => e.id));
  const removed: CanvasOp[] = base.edges
    .filter((e) => !currentIds.has(e.id))
    .map((e) => ({ kind: "removeEdge", edgeId: e.id }));
```

`rebase.ts:181-183`, node ops run first:

```ts
export function diffToOps(base: DiagramDoc, current: DiagramDoc): CanvasOp[] {
  return [...nodeOps(base, current), ...edgeOps(base, current)];
}
```

`rebase.ts:262-272`:

```ts
export function rebaseDiagram(
  serverDoc: DiagramDoc,
  lastSaved: DiagramDoc,
  local: DiagramDoc,
): RawCanvasData | null {
  const ops = diffToOps(lastSaved, local);
  const res = tryCatch(() => applyOps({ nodes: serverDoc.nodes, edges: serverDoc.edges }, ops));
  if (!res.ok) return null;
  const nodes = applyNodeFieldPatches(res.value.nodes, nodeFieldPatches(lastSaved, local));
  return nodes ? { ...res.value, nodes: parentsFirst(nodes) } : null;
}
```

`ops.ts:224-230` and `:288-292`, why it throws:

```ts
function removeNode(state: OpState, op: Op<"removeNode">, i: number): void {
  if (!hasNode(state.nodes, op.nodeId)) {
    throw new CanvasOpError(`Unknown nodeId: ${op.nodeId}`, i);
  }
  state.nodes = state.nodes.filter((n) => getNodeId(n) !== op.nodeId);
  state.edges = state.edges.filter((e) => e.source !== op.nodeId && e.target !== op.nodeId);
}
```

```ts
function removeEdge(state: OpState, op: Op<"removeEdge">, i: number): void {
  if (!state.edges.some((e) => e.id === op.edgeId)) {
    throw new CanvasOpError(`Unknown edgeId: ${op.edgeId}`, i);
  }
```

The existing test never hits this: in `rebase.test.ts:20-23` the deleted node `"gone"` has no
edge (the only edge is `e1`, from `stay` to `move`).

The test helpers at `rebase.test.ts:6-12`:

```ts
function doc(nodes: DiagramDoc["nodes"], edges: DiagramDoc["edges"] = []): DiagramDoc {
  return { nodes, edges };
}

function n(id: string, overrides: Record<string, unknown> = {}): DiagramDoc["nodes"][number] {
  return { id, type: "node", position: { x: 0, y: 0 }, data: { label: id }, ...overrides };
}
```

The strictness of `applyOps` is deliberate (`ops.ts:328-329`: "Unknown kinds throw, so a typo
never passes as a no-op"), and one existing test, `returns null when a re-pointed edge's new
endpoint was deleted on the server` (`rebase.test.ts:104`), must keep passing. So the fix lives in
the rebase, not in the ops.

## Commands

Read from the manifests during the audit; none were run, because the build queue was busy.

| Purpose | Command | Expected |
| --- | --- | --- |
| Install (fresh worktree only) | `pnpm install` | exit 0 |
| This file's tests | `pnpm --filter @heyramzi/ui exec vp test run src/canvas/editor/rebase.test.ts` | exit 0 |
| Canvas tests | `pnpm --filter @heyramzi/ui exec vp test run src/canvas` | exit 0 |
| Typecheck | `pnpm --filter @heyramzi/ui check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Executor toolkit

`software-engineer`. No skill needed.

## Scope

**In scope**, the only files to modify:
- `packages/ui/src/canvas/editor/rebase.ts`
- `packages/ui/src/canvas/editor/rebase.test.ts`

**Out of scope**, though they look related:
- `packages/ui/src/canvas/ops/ops.ts`: agents and CLIs rely on a bad id throwing.
- `packages/ui/src/canvas/editor/dispatch.svelte.ts`: it swallows op errors and doesn't sort
  parents first. Both real, both separate.
- The upsys save queue (`upsys/app/src/lib/diagram/editor/save-queue.ts`): another repo.

## Git

- Work in the worktree you were given. One commit, in the repo's style, for example
  `perf(canvas): the dot grid paints only the strip a pan uncovers (TSK-1131)`. Use
  `fix(canvas): ... (TSK-2143)`.
- `git add --` then `git commit --only --` the two in-scope paths, written out. Don't push.

## Steps

### Step 1: Write the failing tests

In `rebase.test.ts`, add to `describe("diffToOps", ...)`:

1. `replays the delete of a connected node`: base `doc([n("a"), n("b")], [{ id: "e1", source: "a", target: "b" }])`,
   current `doc([n("a")])`. `applyOps({ nodes: base.nodes, edges: base.edges }, diffToOps(base, current))`
   doesn't throw and returns 1 node and 0 edges.

Add to `describe("rebaseDiagram", ...)`:

2. `merges a local delete of a connected node`: `lastSaved` as the base above, `local` as the
   current above, `serverDoc` = base plus a third node `n("c")`. Result isn't null, has nodes `a`
   and `c`, and no edges.
3. `merges when both sides deleted the same node`: `lastSaved` = base, `local` = `doc([n("a")])`,
   `serverDoc` = `doc([n("a"), n("c")])`. Result isn't null and has nodes `a` and `c`.
4. `merges when both sides deleted the same edge`: `lastSaved` = base, `local` and `serverDoc`
   both `doc([n("a"), n("b")])`. Result isn't null and has 0 edges.

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/canvas/editor/rebase.test.ts` fails
on the 4 new tests and passes the rest.

### Step 2: Don't emit `removeEdge` for an edge its node's removal already takes

In `edgeOps`, build the set of node ids present in `base.nodes` and missing from `current.nodes`,
and leave out of `removed` any base edge whose `source` or `target` is in that set. `diffToOps`
passes nothing new: `edgeOps` already gets `base` and `current`.

**Verify**: tests 1 and 2 pass; 3 and 4 still fail.

### Step 3: Drop removals the server already made

In `rebaseDiagram`, after `diffToOps`, filter the ops before `applyOps`: drop a `removeNode` whose
`nodeId` isn't in `serverDoc.nodes`, and a `removeEdge` whose `edgeId` isn't in `serverDoc.edges`.
Also drop a `removeEdge` whose edge in `serverDoc.edges` has a `source` or `target` that an
earlier kept `removeNode` removes. Nothing else is filtered: a patch or move on a node the server
deleted must still throw and return `null`, as the doc comment at `rebase.ts:260` says.

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/canvas/editor/rebase.test.ts` exits 0,
including `returns null when a re-pointed edge's new endpoint was deleted on the server`.

### Step 4: Gates

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/canvas` exits 0,
`pnpm --filter @heyramzi/ui check` exits 0, `pnpm lint` exits 0.

## Tests

The 4 cases in step 1, modelled on `replaying the diff on the base reproduces the current doc`
(`rebase.test.ts:19`) and the `rebaseDiagram` block that starts at line 67.

## Done when

- [ ] `pnpm --filter @heyramzi/ui exec vp test run src/canvas` exits 0 with the 4 new tests present
- [ ] `git diff --stat` lists only `rebase.ts` and `rebase.test.ts`
- [ ] `git status --short` shows no other file as yours

## STOP conditions

Stop and report when:

- The code doesn't match "Current state".
- The fix seems to need a change in `ops.ts` (making `removeNode` or `removeEdge` tolerant). That
  loosens a guarantee other callers use.
- An existing `rebaseDiagram` test that expects `null` starts returning a doc.
- A step's verification fails twice after a reasonable fix.

## Maintenance

Any new op kind that removes things in cascade (a frame taking its children, say) needs the same
two rules: don't emit the cascaded removals, and drop removals the server already made. A reviewer
should check that step 3's filter touches only `removeNode` and `removeEdge`.

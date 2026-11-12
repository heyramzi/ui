# Plan 004: The editor's slash menu opens only on a real slash command, and never eats Enter when empty

> **Executor**: follow the steps in order. Run each verification and confirm the expected result
> before the next step. If a STOP condition occurs, stop and report; don't improvise. Update this
> plan's row in `plans/README.md` when done, unless a reviewer dispatched you and keeps the index.
>
> **Drift check, first**: `git diff --stat 14bdba4..HEAD -- packages/ui/src/editor/editor.svelte packages/ui/src/editor/slash-items.ts packages/ui/src/editor/slash-query.ts packages/ui/src/editor/slash-query.test.ts`.
> If an in-scope file changed, compare "Current state" against the live code. A mismatch is a STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `14bdba4`, 2026-11-09
- **Ticket**: TSK-2143, step 4

## Why this matters

`RichEditor` opens its slash-command menu whenever the 20 characters before the caret end in a
`/` followed by letters, digits or spaces, even in the middle of a word. While that flag is on,
Enter is taken by the menu, including when no command matches and nothing is drawn. So typing
`TCP/IP` and pressing Enter does nothing. Typing `and/or` then Enter is worse: "or" matches
"Unordered list", so the `/or` is deleted and the paragraph becomes a bullet list. With no
matches, ArrowDown computes `% 0` and sets the index to `NaN`. Every app that uses the editor for
task and doc bodies hits this.

## Current state

- `packages/ui/src/editor/editor.svelte`: the TipTap wiring. Holds the trigger and the key handler.
- `packages/ui/src/editor/slash-items.ts`: `buildSlashItems`, which filters commands by query.
  Imports icons, so a test that imports it pulls Svelte components; the new pure function gets its
  own file for that reason.
- No test covers the slash trigger today. `packages/ui/src/editor/*.test.ts` cover block ops, the
  Markdown bridge and the serializer.

`editor.svelte:240-258`, the key handler:

```svelte
				handleKeyDown: (_view, event) => {
					if (showSlashMenu) {
						if (event.key === "ArrowDown") {
							event.preventDefault();
							slashSelectedIndex = (slashSelectedIndex + 1) % slashItems.length;
							return true;
						}
						if (event.key === "ArrowUp") {
							event.preventDefault();
							slashSelectedIndex = (slashSelectedIndex - 1 + slashItems.length) % slashItems.length;
							return true;
						}
						if (event.key === "Enter") {
							event.preventDefault();
							if (slashItems[slashSelectedIndex]) {
								executeSlashCommand(slashItems[slashSelectedIndex]);
							}
							return true;
						}
```

`editor.svelte:296-306`, the trigger inside `onUpdate`:

```svelte
				const { from } = e.state.selection;
				const textBefore = e.state.doc.textBetween(Math.max(0, from - 20), from, "\n");
				const slashMatch = textBefore.match(/\/([a-zA-Z0-9 ]*)$/);

				if (slashMatch) {
					slashQuery = slashMatch[1];
					slashMenuPos = getCaretCoords();
					showSlashMenu = true;
				} else if (showSlashMenu) {
					closeSlashMenu();
				}
```

`editor.svelte:351` draws the menu only when there are items:

```svelte
	{#if showSlashMenu && slashItems.length > 0}
```

`slash-items.ts:128-132`, the filter that makes "or" match "Unordered list":

```ts
  if (!query) return allItems;
  const q = query.toLowerCase();
  return allItems.filter(
    (item) => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
  );
```

`textBetween(..., "\n")` puts a `\n` between blocks, so a `/` typed at the start of a new block
is preceded by `\n` or by nothing.

Conventions: `.svelte` files indent with tabs, `.ts` with 2 spaces. Imports use `#src/...js`
(`editor.svelte:10`: `import { buildSlashItems, type SlashItem } from "#src/editor/slash-items.js";`).
Tests import from `vite-plus/test`. Comments say why, briefly.

## Commands

Read from the manifests during the audit; none were run, because the build queue was busy.

| Purpose | Command | Expected |
| --- | --- | --- |
| Install (fresh worktree only) | `pnpm install` | exit 0 |
| The new tests | `pnpm --filter @heyramzi/ui exec vp test run src/editor/slash-query.test.ts` | exit 0 |
| Editor tests | `pnpm --filter @heyramzi/ui exec vp test run src/editor` | exit 0 |
| Typecheck | `pnpm --filter @heyramzi/ui check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Executor toolkit

`software-engineer`, with `svelte-standards` before editing `editor.svelte`.

## Scope

**In scope**, the only files to modify:
- `packages/ui/src/editor/slash-query.ts` (create)
- `packages/ui/src/editor/slash-query.test.ts` (create)
- `packages/ui/src/editor/editor.svelte`

**Out of scope**, though they look related:
- `packages/ui/src/editor/slash-items.ts`: the label-and-description match stays. Ranking or
  prefix matching is a design call.
- `packages/ui/src/editor/slash-menu.svelte`: the menu's own look and mouse handling.
- `packages/ui/src/editor/inline-editor.svelte`: no slash menu there.
- `editor.svelte` reading `content` only once at mount: real, and a separate change.
- `packages/ui/package.json`: another session has uncommitted edits. No new export.

## Git

- Work in the worktree you were given. One commit, in the repo's style, for example
  `fix(review): gate Stage and transcript hovers to fine pointers, press scale 0.96 (TSK-1802)`.
  Use `fix(editor): ... (TSK-2143)`.
- `git add --` then `git commit --only --` the three in-scope paths, written out. Don't push.

## Steps

### Step 1: Add the pure trigger and its tests

Create `packages/ui/src/editor/slash-query.ts`:

- `export const SLASH_WINDOW = 22;` with a one-line comment: one character of context, the slash,
  and a query of up to 20.
- `export function slashQueryAt(textBefore: string): string | null`: returns the query when
  `textBefore` matches `/(?:^|\s)\/([a-zA-Z0-9 ]{0,20})$/`, else null. The `{0,20}` cap with a
  22-character window means the `^` branch only matches at the true start of the document: in a
  full window the slash always has a character before it.

Create `packages/ui/src/editor/slash-query.test.ts` with these cases:

| `textBefore` | Expected |
| --- | --- |
| `"/"` | `""` |
| `"/head"` | `"head"` |
| `"hello /bul"` | `"bul"` |
| `"line one\n/"` | `""` |
| `"TCP/IP"` | `null` |
| `"and/or"` | `null` |
| `"src/lib"` | `null` |
| `"https://example"` | `null` |
| `"x/aaaaaaaaaaaaaaaaaaaa"` (x, slash, 20 a's) | `null` |
| `"no slash here"` | `null` |

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/editor/slash-query.test.ts` exits 0.

### Step 2: Use it in `onUpdate`

In `editor.svelte`, import `slashQueryAt` and `SLASH_WINDOW` from `#src/editor/slash-query.js`.
Replace the `textBefore` and `slashMatch` lines so the window is `from - SLASH_WINDOW` and the
query is `slashQueryAt(textBefore)`. Open the menu when the query isn't null (an empty string is
a valid query), set `slashQuery` to it, and keep the `else if (showSlashMenu) closeSlashMenu();`
branch.

**Verify**: `grep -n 'a-zA-Z0-9 \]\*' packages/ui/src/editor/editor.svelte` returns nothing, and
`pnpm --filter @heyramzi/ui check` exits 0.

### Step 3: Let keys through when there's nothing to pick

In `handleKeyDown`, change the guard from `if (showSlashMenu) {` to
`if (showSlashMenu && slashItems.length > 0) {`. With no items the handler falls through to the
editor's normal Enter and arrows, which matches what's on screen (`editor.svelte:351` draws no
menu then). Escape with no items also falls through, which is fine: there's nothing to close
visually, and the next non-matching keystroke clears the flag.

**Verify**: `grep -n 'showSlashMenu && slashItems.length > 0' packages/ui/src/editor/editor.svelte`
shows 2 lines (the key handler and the markup).

### Step 4: Gates

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/editor` exits 0,
`pnpm --filter @heyramzi/ui check` exits 0, `pnpm lint` exits 0.

## Tests

The table in step 1. Model the file on `packages/ui/src/editor/serializer.test.ts:1-2` for the
imports (`describe`, `expect`, `it` from `vite-plus/test`), and use `it.each`.

## Done when

- [ ] `pnpm --filter @heyramzi/ui exec vp test run src/editor` exits 0 and includes `slash-query.test.ts`
- [ ] `grep -n 'slashQueryAt' packages/ui/src/editor/editor.svelte` shows the import and the call
- [ ] `git status --short` shows only the three in-scope files as yours

## STOP conditions

Stop and report when:

- The code doesn't match "Current state".
- `handleKeyDown` has other branches after Escape that depend on `showSlashMenu` being true with
  zero items. Report them instead of guessing.
- An editor test fails because it types a slash mid-word and expects the menu.
- A step's verification fails twice after a reasonable fix.

## Maintenance

The key handler itself has no test: it needs a mounted TipTap editor in jsdom, which this plan
leaves out to stay small. If a later change adds an editor mount test, type `a/b` then Enter and
assert a new paragraph. A reviewer should try, in the docs site's editor demo: `/` at line start
(menu opens), `TCP/IP` then Enter (new line), `/zzz` then Enter (new line, no menu).

# Plan 002: RichRenderer drops unsafe link and image URLs before `{@html}`

> **Executor**: follow the steps in order. Run each verification and confirm the expected result
> before the next step. If a STOP condition occurs, stop and report; don't improvise. Update this
> plan's row in `plans/README.md` when done, unless a reviewer dispatched you and keeps the index.
>
> **Drift check, first**: `git diff --stat 14bdba4..HEAD -- packages/ui/src/editor/serializer.ts packages/ui/src/editor/serializer.test.ts packages/ui/src/editor/safe-url.ts`.
> If an in-scope file changed, compare "Current state" against the live code. A mismatch is a STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `14bdba4`, 2026-11-09
- **Ticket**: TSK-2143, step 2

## Why this matters

`renderTiptapContent` turns stored TipTap JSON into an HTML string, and `renderer.svelte` puts it
on the page with `{@html}`. A link mark's `href` and an image's `src` are written with attribute
escaping only, so a stored `javascript:` link runs script when a viewer clicks it. The comment in
the renderer says the JSON is "trusted admin CMS JSON", but apps render task descriptions and
project docs through it, and those are written by teammates, clients, agents and CLIs that never
pass through the editor's own link filter. After this plan the serializer keeps the link text and
drops the unsafe `href`, and drops an image with an unsafe `src`.

## Current state

- `packages/ui/src/editor/serializer.ts` (about 375 lines): pure functions, no Svelte. Exports
  `renderTiptapContent`, `extractHeadings`, `extractYoutubeVideos`.
- `packages/ui/src/editor/renderer.svelte:33-34` and its `{@html html}`: the sink. Not edited.
- `packages/ui/src/ai/response/Response.svelte:29` and `:39-51`: a working `safeUrl` for model
  output. It's the behaviour to copy; that file isn't edited.

`serializer.ts:160-171`:

```ts
function renderImage(node: Node): string {
  const src = strAttr(node.attrs, "src");
  if (!src) return "";
  const attrs = renderAttributes({
    alt: strAttr(node.attrs, "alt") ?? "",
    title: strAttr(node.attrs, "title"),
    width: numString(node.attrs, "width"),
    height: numString(node.attrs, "height"),
    "data-align": strAttr(node.attrs, "align"),
  });
  return `<img src="${escapeAttr(src)}"${attrs} />`;
}
```

`serializer.ts:322-333`:

```ts
function wrapMark(content: string, mark: Mark): string {
  if (mark.type === "link") {
    const attrs = renderAttributes({
      href: strAttr(mark.attrs, "href") ?? "",
      target: strAttr(mark.attrs, "target"),
      rel: strAttr(mark.attrs, "rel"),
    });
    return `<a${attrs}>${content}</a>`;
  }
  const tag = pick(MARK_TAGS, mark.type);
  return tag ? `<${tag}>${content}</${tag}>` : content;
}
```

`renderAttributes` (`serializer.ts:335-340`) skips a value that is `undefined` or `""`.

The reference in `Response.svelte:29` and `:39-51`:

```ts
	const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;
```

```ts
	function safeUrl(raw: string | null | undefined): string | null {
		if (!raw) return null;
		// WHY: browsers drop tabs, newlines and control bytes from a URL, so "java\tscript:" runs as javascript:.
		const href = [...raw]
			.filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127)
			.join("")
			.trim();
		// Relative URLs and same-page anchors carry no scheme, so they are safe.
		if (href.startsWith("#") || href.startsWith("/") || href.startsWith(".")) return href;
		if (SAFE_SCHEME.test(href)) return href;
		if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) return href; // no scheme => relative path
		return null; // javascript:, data:, vbscript:, ...
	}
```

`serializer.test.ts:1-2` shows the test shape: `import { describe, expect, it } from "vite-plus/test";`
and `import { renderTiptapContent } from "#src/editor/serializer.js";`, then a doc literal in and
a string assertion out.

Conventions: `.ts` files indent with 2 spaces, imports use `#src/...js`, comments say why.
`packages/ui/src/svelte-reexports.test.ts` forbids a `.ts` file re-exporting a named value from a
`.svelte` module, which is why the helper gets its own `.ts` file and isn't imported from
`Response.svelte`.

## Commands

Read from the manifests during the audit; none were run, because the build queue was busy.

| Purpose | Command | Expected |
| --- | --- | --- |
| Install (fresh worktree only) | `pnpm install` | exit 0 |
| This file's tests | `pnpm --filter @heyramzi/ui exec vp test run src/editor/serializer.test.ts` | exit 0 |
| All ui tests | `pnpm --filter @heyramzi/ui test` | exit 0 |
| Typecheck | `pnpm --filter @heyramzi/ui check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Executor toolkit

`software-engineer`. No skill needed.

## Scope

**In scope**, the only files to modify:
- `packages/ui/src/editor/safe-url.ts` (create)
- `packages/ui/src/editor/serializer.ts`
- `packages/ui/src/editor/serializer.test.ts`

**Out of scope**, though they look related:
- `packages/ui/src/ai/response/Response.svelte`: keeps its own copy for now. Pointing it at the
  new module is a follow-up, so this plan stays to one behaviour change.
- `packages/ui/package.json`: another session has uncommitted edits. Don't add an export for
  `safe-url.ts`; it's internal.
- `packages/ui/src/editor/renderer.svelte`: the sink stays; only its input gets safer.
- `packages/ui/src/editor/doc-blocks.ts:57` (a label written with `innerHTML`): separate, low risk.
- The YouTube embed path in the serializer: it builds its URL from a parsed video id.

## Git

- Work in the worktree you were given. One commit, in the repo's style, for example
  `fix(review): gate Stage and transcript hovers to fine pointers, press scale 0.96 (TSK-1802)`.
  Use `fix(editor): ... (TSK-2143)`.
- `git add --` then `git commit --only --` the three in-scope paths, written out. Don't push.

## Steps

### Step 1: Write the failing tests

In `serializer.test.ts`, add a `describe("unsafe URLs", ...)` block. Each case renders a doc with
one paragraph holding one text node `"click"` with a link mark, or one image node:

1. `href: "javascript:alert(1)"`: output contains `click`, and doesn't contain `javascript:` or `href=`.
2. `href: "java\tscript:alert(1)"` (a tab inside the scheme): same assertions.
3. `href: "data:text/html,x"` and `href: "vbscript:x"`: no `href=`.
4. `href: "https://example.com/a?b=1"`, `"/docs"`, `"#top"`, `"mailto:a@example.com"`: each
   appears as the `href` value (the `&` case isn't used, to keep escaping out of the assertion).
5. Image `src: "javascript:alert(1)"`: output contains no `<img`.
6. Image `src: "https://example.com/a.png"` and `src: "data:image/png;base64,AAAA"`: output
   contains `<img`.
7. Image `src: "data:image/svg+xml;base64,AAAA"`: output contains no `<img`.

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/editor/serializer.test.ts` fails on
cases 1, 2, 3, 5 and 7 and passes 4 and 6.

### Step 2: Add `safe-url.ts`

Create `packages/ui/src/editor/safe-url.ts` exporting:

- `safeUrl(raw: string | null | undefined): string | null`, the same logic as the reference above.
- `safeImageUrl(raw)`: returns `safeUrl(raw)` when that isn't null; otherwise returns the cleaned
  string when it matches `/^data:image\/(?:png|jpe?g|gif|webp|avif);base64,/i`; otherwise null.
  Pasted images can be stored as `data:` URLs, so those formats stay; SVG doesn't.

**Verify**: `pnpm --filter @heyramzi/ui check` exits 0.

### Step 3: Use it in the serializer

- `wrapMark`: compute `const href = safeUrl(strAttr(mark.attrs, "href"))`. When it's null, return
  `content` alone (the text, no `<a>`). Otherwise render as today with `href`, and when `target`
  is set and `rel` isn't, set `rel` to `"noopener noreferrer"`.
- `renderImage`: `const src = safeImageUrl(strAttr(node.attrs, "src"));` then the existing
  `if (!src) return "";`.

**Verify**: `pnpm --filter @heyramzi/ui exec vp test run src/editor/serializer.test.ts` exits 0.

### Step 4: Gates

**Verify**: `pnpm --filter @heyramzi/ui test` exits 0, `pnpm --filter @heyramzi/ui check` exits 0,
`pnpm lint` exits 0.

## Tests

The 7 cases in step 1, modelled on the first test in `serializer.test.ts:19-30`.

## Done when

- [ ] `pnpm --filter @heyramzi/ui test` exits 0 with the new `unsafe URLs` block present
- [ ] `grep -n 'safeUrl\|safeImageUrl' packages/ui/src/editor/serializer.ts` shows both in use
- [ ] `git status --short` shows only the three in-scope files as yours

## STOP conditions

Stop and report when:

- The code doesn't match "Current state".
- An existing serializer or markdown test fails after step 3 because it expects a link scheme
  outside `http`, `https`, `mailto`, `tel` or a relative path (for example an app deep link).
  Report the scheme; widening the allowlist is a product call.
- A step's verification fails twice after a reasonable fix.

## Maintenance

A new node type that writes a URL attribute (a file embed, a video poster) has to go through
`safeUrl` too. A reviewer should check case 2, the control-character strip, hardest: it's the one
a naive scheme test misses. Follow-ups left out: `Response.svelte` importing this module, and a
consumer-side check that write paths validate body JSON.

# Plan 001: The review server refuses cross-site writes and survives a dropped upload

> **Executor**: follow the steps in order. Run each verification and confirm the expected result
> before the next step. If a STOP condition occurs, stop and report; don't improvise. Update this
> plan's row in `plans/README.md` when done, unless a reviewer dispatched you and keeps the index.
>
> **Drift check, first**: `git diff --stat 14bdba4..HEAD -- packages/review/src/server/handler.ts packages/review/src/server/handler.test.ts`.
> If an in-scope file changed, compare "Current state" against the live code. A mismatch is a STOP.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `14bdba4`, 2026-11-09
- **Ticket**: TSK-2143, step 1

## Why this matters

`@heyramzi/review` is public on npmjs. Its Node handler serves a review page on localhost for
Editor OS, Shorts OS and client tools, and `POST <base>/<id>/act` approves beats and writes or
deletes notes. Two gaps:

1. Any web page open in the same browser can send that POST. The handler never looks at `Origin`,
   and its content-type test is a substring match, so a form-style `text/plain` request that
   carries the text `application/json` in a parameter passes with no CORS preflight.
2. `act` and `events` are started with `void` and no catch. A client that drops mid-upload makes
   the body read reject, and an unhandled rejection ends a Node process under default flags. One
   closed tab can take the whole tool server down.

After this plan, a write from another origin gets a 403, only a real JSON media type is read, and
a rejected `act` or `events` is logged and answered, never left unhandled.

## Current state

- `packages/review/src/server/handler.ts` (162 lines): `createReviewHandler(adapter, options)`
  returns the request handler. It's the only file with the bug.
- `packages/review/src/server/http.ts`: `readBody` / `readBytes` (lines 164 to 178) iterate the
  request stream with `for await`, which rejects when the client aborts. Not edited here.
- `packages/review/src/server/handler.test.ts`: starts a real `node:http` server on port 0 and
  talks to it with `fetch`. New tests go here.

`handler.ts:7-13`, the options type:

```ts
export type ReviewHandlerOptions = {
  /** The URL prefix, e.g. "/review". */
  base: string;
  heartbeatMs?: number;
  /** Largest POST body in bytes. */
  maxBody?: number;
};
```

`handler.ts:22-26`, the error answer to reuse:

```ts
function fail(response: ServerResponse, error: unknown): void {
  if (error instanceof ReviewError) return problem(response, error.status, error.message);
  console.error("[review]", error);
  problem(response, 500, "Couldn't read this video.");
}
```

`handler.ts:96-99`, the substring test:

```ts
    if (!String(request.headers["content-type"] ?? "").includes("application/json")) {
      return problem(response, 415, "Send JSON.");
    }
    const raw = await readBody(request, maxBody);
```

`handler.ts:140-141` and `:152-153`, the two unguarded calls:

```ts
    } else if (route === "events" && method === "GET") {
      void events(request, response, id);
```

```ts
    } else if (route === "act" && method === "POST") {
      void act(request, response, id);
```

`handler.test.ts:68-73`, the helper every new test uses:

```ts
const post = (body: unknown, type = "application/json") =>
  fetch(`${url}/review/v1/act`, {
    method: "POST",
    headers: { "content-type": type },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
```

`handler.test.ts:104-107` is the only content-type test today, a bare `text/plain`.

Conventions: imports use the `#src/...js` alias (see `handler.ts:1-5`). Tests import from
`vite-plus/test`. Comments explain why, in plain words, and stay short. User-facing error strings
are short sentences ("Send JSON.", "Wrong method.").

## Commands

Read from the manifests during the audit; none were run, because the build queue was busy.

| Purpose | Command | Expected |
| --- | --- | --- |
| Install (fresh worktree only) | `pnpm install` | exit 0 |
| Tests | `pnpm --filter @heyramzi/review test` | exit 0 |
| Typecheck | `pnpm --filter @heyramzi/review check` | exit 0 |
| Lint | `pnpm lint` | exit 0 |

## Executor toolkit

`software-engineer`. No skill needed.

## Scope

**In scope**, the only files to modify:
- `packages/review/src/server/handler.ts`
- `packages/review/src/server/handler.test.ts`

**Out of scope**, though they look related:
- `packages/review/src/server/http.ts`: `readBytes` is right to reject on abort; the caller handles it.
- `packages/review/src/server/guards.ts`: `parseAction` passes unchecked `chat`, `reply` and
  `target` fields to the adapter. Real, and a separate plan.
- `packages/review/src/ui/Stage.svelte`: another session has uncommitted edits there.
- A `Host` header allowlist against DNS rebinding: needs a decision on which hosts tools use.
- `packages/review/package.json` and `CHANGELOG.md`: `scripts/release.sh` writes both.

## Git

- Work in the worktree you were given. One commit, in the repo's style, for example
  `fix(release): a perf-only patch lists its commits, not "initial publish" (TSK-1131)`. Use
  `fix(review): ... (TSK-2143)`.
- `git add -- packages/review/src/server/handler.ts packages/review/src/server/handler.test.ts`,
  then `git commit --only --` the same two paths. Don't push.

## Steps

### Step 1: Write the failing tests

In `handler.test.ts`, inside `describe("createReviewHandler", ...)`, add:

1. `answers 415 when application/json is only a parameter`: `post({ type: "refresh" }, "text/plain; x=application/json")` gives status 415.
2. `still reads JSON with a charset`: `post({ type: "refresh" }, "application/json; charset=utf-8")` gives 200.
3. `refuses a write from another origin`: a `fetch` to `${url}/review/v1/act` with headers
   `content-type: application/json` and `origin: https://elsewhere.example` gives 403, and
   `seen.length` is unchanged.
4. `takes a write from its own origin and from a client that sends none`: the same request with
   `origin: url` gives 200; the existing `post` (no Origin header) gives 200.
5. `stays up when a client drops mid-upload`: open a `node:net` socket to the server's port, write
   `POST /review/v1/act HTTP/1.1\r\nhost: localhost\r\ncontent-type: application/json\r\ncontent-length: 1000\r\n\r\n{"type":`,
   then `socket.destroy()`. Wait 50 ms, then `fetch(`${url}/review/v1/state`)` gives 200. Vitest
   fails a run on an unhandled rejection, so this test is red before step 3.

`{ type: "refresh" }` is the action the existing test at line 106 posts; if `parseAction` refuses
it, use the note body from line 120 (`{ type: "note", target: { kind: "time", at: 2, span: 1, anchor: { source: "take-1", at: 9.5 } }, text: "x" }`).

**Verify**: `pnpm --filter @heyramzi/review test` fails on tests 1, 3 and 5, and passes 2 and 4.

### Step 2: Read the media type, and check Origin on `act`

In `handler.ts`:

- Replace the substring test in `act` with an exact media type: take the header up to the first
  `;`, trim, lowercase, and require `application/json`.
- Add `allowedOrigins?: string[]` to `ReviewHandlerOptions`, documented in one line: extra origins
  allowed to write, beyond the request's own host.
- At the top of `act`, before the content-type test: when `request.headers.origin` is set, parse
  it with `new URL` inside a try. Allow it when its `host` equals `request.headers.host`, or when
  the origin string is in `options.allowedOrigins`. Otherwise `return problem(response, 403, "Wrong origin.")`.
  A request with no `Origin` header passes: CLIs and agents send none, and browsers always send
  one on a cross-site POST.

**Verify**: `pnpm --filter @heyramzi/review test` now fails only on test 5.

### Step 3: Catch the two floating promises

Replace `void events(request, response, id);` and `void act(request, response, id);` with calls
that catch: on rejection, when `response.headersSent` is false and `response.destroyed` is false,
call `fail(response, error)`; otherwise `console.error("[review]", error)` and end the response if
it's still writable. One small local helper (`settle(promise, response)`) used by both.

**Verify**: `pnpm --filter @heyramzi/review test` exits 0.

### Step 4: Gates

**Verify**: `pnpm --filter @heyramzi/review check` exits 0, and `pnpm lint` exits 0.

## Tests

The 5 cases in step 1, modelled on `handler.test.ts:104-107` (status assertions through `post`).

## Done when

- [ ] `pnpm --filter @heyramzi/review test` exits 0 with the 5 new tests present
- [ ] `grep -n 'includes("application/json")' packages/review/src/server/handler.ts` returns nothing
- [ ] `grep -n 'void act(\|void events(' packages/review/src/server/handler.ts` returns nothing
- [ ] `git status --short` shows only the two in-scope files as yours

## STOP conditions

Stop and report when:

- The code doesn't match "Current state".
- A consumer inside this repo (`packages/review/dev/`) posts to `act` from a different origin than
  the one serving the page, so step 2 would break the dev setup. Report the origin pair.
- Test 5 passes before step 3: the abort doesn't reject in this Node version, so the crash claim
  is wrong and step 3 needs rethinking.
- A step's verification fails twice after a reasonable fix.

## Maintenance

A reviewer should look hardest at the Origin rule: it must not block the tools' own pages, which
load from the same host and port. Left out on purpose: the `Host` allowlist, and schema checks on
note fields in `guards.ts`. Any new write route added to the handler needs the same Origin check.

/**
 * SvelteKit `handleError` hooks over the SDK-free Sentry sender. Kit 3 only: it relies on
 * the `kind` field kit 3 added and kit 2 never sent.
 *
 * Imports nothing from `$app/*` or `@sveltejs/kit`. The app passes `dev` and `release`
 * (`dev` and `version` from `$app/env`) and the DSN from its own env module, so the
 * package typechecks and tests without a kit install.
 */

import { captureError } from "#src/errors/sentry/index.js";
import type { SentryScalar } from "#src/errors/sentry/protocol.js";

/** The part of kit's `CaughtError & { event }` these hooks read, so kit's hook types accept ours. */
export type CaughtInput = {
  kind: "app" | "framework" | "validation" | "unknown";
  error: unknown;
  event: { url: URL; route: { id: string | null } };
};

type BaseOptions<R> = {
  /** Public client key on the browser, private on the server. Empty or missing sends nothing. */
  dsn: string | undefined;
  /** `dev` from `$app/env`. Reports nothing while true. */
  dev: boolean;
  /** `version` from `$app/env`. Set `kit.version.name` to the commit SHA so a fix is traceable. */
  release: string | undefined;
  /** Becomes the `surface` tag, e.g. "web.server". */
  surface: string;
  /** Defaults to "production". Pass "preview" or "staging" from the app's env where those exist. */
  environment?: string;
  tags?: Record<string, SentryScalar | null | undefined>;
  /** Logs the error to the console before reporting. Pass false when `respond` already logs. */
  log?: boolean;
  /**
   * The user-facing `App.Error`, returned for every caught error, reported or not. Return
   * nothing to keep kit's defaults. A throw here is logged and kit's defaults apply.
   */
  respond?: (input: CaughtInput) => R | Promise<R>;
};

export type ClientErrorOptions<R> = BaseOptions<R> & {
  /**
   * Return true to drop an error that would otherwise be reported. Runs only for errors
   * that pass the status filter, so an expensive check (kit's `updated.check()`) isn't
   * paid on a 404.
   */
  skip?: (input: CaughtInput) => boolean | Promise<boolean>;
};

export type ServerErrorOptions<R> = BaseOptions<R>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Whether a caught error is ours to be paged on. An `app` error is one thrown with
 * `error()`, so it's expected. A framework or validation error is ours only at 500 and up
 * (a scanner's 404 isn't). Anything unknown is a bug. Kit 3 dropped `status` from the
 * hook input, so the status comes off the error itself.
 */
export function shouldReport({ kind, error }: Pick<CaughtInput, "kind" | "error">): boolean {
  if (kind === "app") return false;
  if (kind === "unknown") return true;
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status >= 500 : true;
}

// Chrome, Safari and Firefox each word a dynamic import that 404s differently.
const STALE_CHUNK =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/;

/** A dynamic import failed: a deploy removed the chunk this old page points at, or the network dropped. */
export function isStaleChunk(error: unknown): boolean {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && STALE_CHUNK.test(message);
}

const RELOAD_KEY = "heyramzi:stale-chunk-reload";
/** A tab left open across two deploys reloads on each. Inside this window a repeat means the reload didn't help. */
const RELOAD_WINDOW_MS = 30_000;

type ReloadEnv = {
  storage: Pick<Storage, "getItem" | "setItem">;
  now: () => number;
  reload: () => void;
};

function browserEnv(): ReloadEnv | null {
  try {
    return { storage: sessionStorage, now: Date.now, reload: () => location.reload() };
  } catch {
    return null;
  }
}

/**
 * Reload the page to fetch the new build, at most once per window. True when it reloaded.
 * False when it already did (the chunk is really gone, or the network is down) or when
 * storage is blocked, because without the guard a broken chunk would loop reloads.
 */
export function reloadForStaleChunk(env: ReloadEnv | null = browserEnv()): boolean {
  if (!env) return false;
  try {
    const last = Number(env.storage.getItem(RELOAD_KEY));
    if (env.now() - last < RELOAD_WINDOW_MS) return false;
    env.storage.setItem(RELOAD_KEY, String(env.now()));
    env.reload();
    return true;
  } catch {
    return false;
  }
}

/** Kit's HttpError isn't an Error, so one with a message becomes one to give Sentry a title and stack. */
function toError(raw: unknown): unknown {
  if (raw instanceof Error) return raw;
  const message = (raw as { message?: unknown } | null)?.message;
  return typeof message === "string" ? new Error(message) : raw;
}

function isLocalHost(input: CaughtInput): boolean {
  return LOCAL_HOSTS.has(input.event.url.hostname);
}

async function report<R>(
  options: BaseOptions<R>,
  input: CaughtInput,
  extraTags?: Record<string, SentryScalar>,
): Promise<void> {
  const { dsn, dev, release, surface, environment = "production", tags } = options;
  // WHY the host check: wrangler dev and vite preview serve localhost with `dev` false.
  if (dev || !dsn || isLocalHost(input)) return;
  await captureError({
    dsn,
    error: toError(input.error),
    surface,
    release,
    environment,
    tags: { ...tags, ...extraTags, route: input.event.route.id },
    extra: { pathname: input.event.url.pathname, kind: input.kind },
  });
}

async function respondTo<R>(options: BaseOptions<R>, input: CaughtInput): Promise<R | undefined> {
  if (!options.respond) return undefined;
  try {
    return await options.respond(input);
  } catch (err) {
    console.error("[handleError] respond threw:", err);
    return undefined;
  }
}

/**
 * `handleError` for `hooks.client.ts`. A stale-chunk error reloads the page once instead
 * of reporting. Everything else that's ours goes to Sentry, tagged with the environment
 * and release.
 */
export function createHandleClientError<R = undefined>(options: ClientErrorOptions<R>) {
  return async (input: CaughtInput): Promise<R | undefined> => {
    try {
      let tags: Record<string, SentryScalar> | undefined;
      if (isStaleChunk(input.error)) {
        if (reloadForStaleChunk()) return respondTo(options, input);
        // Already reloaded once: report it, tagged so it filters apart from a real bug.
        tags = { stale_chunk: true };
      }
      if (shouldReport(input)) {
        if (options.log !== false) console.error("[handleError]", input.error);
        if (!(await options.skip?.(input))) await report(options, input, tags);
      }
    } catch (err) {
      console.error("[handleError] reporting failed:", err);
    }
    return respondTo(options, input);
  };
}

/**
 * `handleError` for `hooks.server.ts`. Awaits the send, because a Worker stops when the
 * response ends and would drop a fire-and-forget request. The `cause` chain rides along
 * in the event (see `buildErrorRequest`).
 */
export function createHandleServerError<R = undefined>(options: ServerErrorOptions<R>) {
  return async (input: CaughtInput): Promise<R | undefined> => {
    try {
      if (shouldReport(input)) {
        // WHY the error itself, not its stack: Node and workerd print `cause` for an Error.
        if (options.log !== false) console.error("[handleError]", toError(input.error));
        await report(options, input);
      }
    } catch (err) {
      console.error("[handleError] reporting failed:", err);
    }
    return respondTo(options, input);
  };
}

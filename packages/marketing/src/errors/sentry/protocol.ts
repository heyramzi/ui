/**
 * Pure Sentry envelope helpers, no I/O. Any runtime (Apps Script, Convex, Workers,
 * extensions) builds the request here and sends it with its own transport.
 */

export type SentryScalar = string | number | boolean;

export type CaptureInput = {
  dsn: string;
  error: unknown;
  /** Where it happened, e.g. "sidebar.sync". Becomes the `surface` tag. */
  surface?: string;
  release?: string;
  environment?: string;
  user?: { id?: string; email?: string };
  tags?: Record<string, SentryScalar | null | undefined>;
  extra?: Record<string, unknown>;
  /** 32 hex chars. Generated when omitted. */
  eventId?: string;
  /** Epoch milliseconds. Defaults to now. */
  now?: number;
};

export type SentryRequest = {
  url: string;
  headers: Record<string, string>;
  body: string;
};

type Dsn = { publicKey: string; origin: string; projectId: string };

type Frame = { function?: string; filename?: string; lineno?: number; colno?: number };

/** Parse `https://<key>@<host>/<projectId>`. Returns null for anything else. */
export function parseDsn(dsn: string): Dsn | null {
  const m = /^(https?):\/\/([^@/]+)@([^/]+)\/(?:.*\/)?(\d+)\/?$/.exec(dsn.trim());
  if (!m) return null;
  return { publicKey: m[2], origin: `${m[1]}://${m[3]}`, projectId: m[4] };
}

function randomHex32(): string {
  let out = "";
  for (let i = 0; i < 32; i++) out += Math.floor(Math.random() * 16).toString(16);
  return out;
}

const V8_FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?\s*$/;

/** V8 stack text to Sentry frames, oldest call first as Sentry expects. */
export function parseStack(stack: string | undefined): Frame[] {
  if (!stack) return [];
  const frames: Frame[] = [];
  for (const line of stack.split("\n")) {
    const m = V8_FRAME.exec(line);
    if (!m) continue;
    const frame: Frame = { filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) };
    if (m[1]) frame.function = m[1];
    frames.push(frame);
  }
  return frames.toReversed();
}

type Described = { type: string; value: string; stack?: string };

function describe(error: unknown): Described {
  if (error instanceof Error) {
    return { type: error.name || "Error", value: error.message, stack: error.stack };
  }
  if (typeof error === "string") return { type: "Error", value: error };
  try {
    return { type: "Error", value: JSON.stringify(error) };
  } catch {
    return { type: "Error", value: String(error) };
  }
}

/** Deepest `cause` walked. A wrapper that wraps itself in a loop stops here too. */
const MAX_CHAIN = 5;

/**
 * The error and its `cause` chain as Sentry exception values, root cause first and the
 * thrown error last. Drizzle's "Failed query" keeps D1's real message in `cause`, so
 * without the chain the event shows the SQL and never why it failed.
 */
function describeChain(error: unknown): Described[] {
  const chain = [describe(error)];
  const seen = new Set<unknown>([error]);
  let next = error instanceof Error ? error.cause : undefined;
  while (next !== undefined && next !== null && !seen.has(next) && chain.length < MAX_CHAIN) {
    seen.add(next);
    chain.push(describe(next));
    next = next instanceof Error ? next.cause : undefined;
  }
  return chain.toReversed();
}

function cleanTags(input: CaptureInput): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.tags ?? {})) {
    if (v !== null && v !== undefined) tags[k] = String(v);
  }
  if (input.surface) tags.surface = input.surface;
  return tags;
}

/** Build the envelope POST for one error. Null when the DSN is missing or malformed. */
export function buildErrorRequest(input: CaptureInput): SentryRequest | null {
  const dsn = parseDsn(input.dsn ?? "");
  if (!dsn) return null;
  const eventId = input.eventId ?? randomHex32();
  const now = input.now ?? Date.now();
  const values = describeChain(input.error).map(({ type, value, stack }) => {
    const exception: Record<string, unknown> = { type, value };
    const frames = parseStack(stack);
    if (frames.length) exception.stacktrace = { frames };
    return exception;
  });

  const event: Record<string, unknown> = {
    event_id: eventId,
    timestamp: now / 1000,
    platform: "javascript",
    level: "error",
    tags: cleanTags(input),
    exception: { values },
  };
  if (input.release) event.release = input.release;
  if (input.environment) event.environment = input.environment;
  if (input.user) event.user = input.user;
  if (input.extra) event.extra = input.extra;

  const sentAt = new Date(now).toISOString();
  const body = [
    JSON.stringify({ event_id: eventId, sent_at: sentAt, dsn: input.dsn }),
    JSON.stringify({ type: "event" }),
    JSON.stringify(event),
  ].join("\n");

  return {
    url: `${dsn.origin}/api/${dsn.projectId}/envelope/?sentry_key=${dsn.publicKey}&sentry_version=7`,
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body,
  };
}

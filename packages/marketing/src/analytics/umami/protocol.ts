/**
 * Pure Umami wire-protocol helpers — no I/O, no global dependencies.
 */

/*
 * Consumers in any runtime (browser, Node, Convex actions, Apps Script, service workers, edge functions, Chrome extensions) can use these to build a request body for Umami's `/api/send` endpoint,
 */

/*
 * then plug in their own transport (fetch, UrlFetchApp.fetch, etc.) without re-implementing the protocol details.
 */

/*
 * Umami's `/api/send` accepts one event per request. Authentication is via the website ID embedded in the payload — no API key.
 */

/*
 * The User-Agent header is required; without it the request is dropped.
 */

import type { EventData } from "#src/analytics/types.js";

export const UMAMI_ENDPOINTS = {
  send: "/api/send",
} as const;

export type SendBodyInput = {
  /** Umami website ID (UUID). */
  websiteId: string;
  /** Event name. Required for custom events; omit to record a raw pageview. */
  name?: string;
  /** Pathname (or full URL) the event is associated with. Defaults to "/". */
  url?: string;
  /** Hostname the event came from. Optional but useful for multi-domain dashboards. */
  hostname?: string;
  /** Page title. Optional. */
  title?: string;
  /** Referrer URL. Optional. */
  referrer?: string;
  /** Browser language tag (e.g. "en-US"). Optional. */
  language?: string;
  /** Screen size (e.g. "1920x1080"). Optional. */
  screen?: string;
  /** Custom event data. Coerced via `coerceData`. */
  data?: EventData | Record<string, unknown>;
};

export type SendBody = {
  type: "event";
  payload: {
    website: string;
    url: string;
    name?: string;
    hostname?: string;
    title?: string;
    referrer?: string;
    language?: string;
    screen?: string;
    data?: Record<string, string | number | boolean>;
  };
};

/**
 * Coerce arbitrary event data to Umami-safe primitives. Umami accepts
 * string/number/boolean values in `data`. Nulls and undefineds are dropped.
 */
export function coerceData(
  data?: EventData | Record<string, unknown>,
): Record<string, string | number | boolean> | undefined {
  if (!data) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    } else {
      out[key] = String(value);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Build the JSON body for a POST to Umami's `/api/send`. */
export function buildSendBody(input: SendBodyInput): SendBody {
  const data = coerceData(input.data);
  const payload: SendBody["payload"] = {
    website: input.websiteId,
    url: input.url ?? "/",
  };
  if (input.name) payload.name = input.name;
  if (input.hostname) payload.hostname = input.hostname;
  if (input.title) payload.title = input.title;
  if (input.referrer) payload.referrer = input.referrer;
  if (input.language) payload.language = input.language;
  if (input.screen) payload.screen = input.screen;
  if (data) payload.data = data;
  return { type: "event", payload };
}

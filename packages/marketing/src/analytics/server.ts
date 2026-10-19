/**
 * Server-side Umami tracking. A Worker cancels a fetch still in flight once the response
 * returns, so await each tracker or hand it to `waitUntil`.
 */

import type { EventData } from "#src/analytics/types.js";
import { buildSendBody, UMAMI_ENDPOINTS } from "#src/analytics/umami/protocol.js";

type ServerConfig = {
  hostUrl: string;
  websiteId: string;
  /** Site hostname, such as `getseam.app`. Without it Umami logs the event under `localhost`. */
  hostname?: string;
  /** Umami answers a non-browser user agent with `beep` and drops the event. */
  userAgent?: string;
};

/** Per-event options. A string is the url, as in 3.0. */
export type ServerEventOptions = {
  url?: string;
  /** Umami keys the session on it. Without one, every event shares the Worker's session. */
  id?: string;
};

// Umami's bot filter answers `beep` to any agent containing "Server" (tested 19 Oct 2026).
const DEFAULT_USER_AGENT = "Mozilla/5.0 Marketing/1.0";
const TIMEOUT_MS = 3000;

let _config: ServerConfig | null = null;

/** Initialize the server-side Umami client. Call once at startup. */
export function initServer(config: ServerConfig): void {
  _config = config;
}

/**
 * Sends one event and checks Umami recorded it. Never throws.
 * Resolves false on a timeout, an HTTP error or a `beep` rejection.
 */
export async function trackServer(
  name: string,
  data?: EventData,
  options?: string | ServerEventOptions,
): Promise<boolean> {
  const { url, id } =
    typeof options === "string" ? { url: options, id: undefined } : (options ?? {});
  try {
    if (!_config) throw new Error("Call initServer() before tracking events");

    const body = buildSendBody({
      websiteId: _config.websiteId,
      hostname: _config.hostname,
      name,
      url,
      data,
    });
    const payload = id ? { ...body.payload, id } : body.payload;

    const response = await fetch(`${_config.hostUrl.replace(/\/$/, "")}${UMAMI_ENDPOINTS.send}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": _config.userAgent ?? DEFAULT_USER_AGENT,
      },
      body: JSON.stringify({ ...body, payload }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await response.text();
    if (!response.ok || text.includes("beep")) {
      throw new Error(`HTTP ${response.status}: ${text.slice(0, 120)}`);
    }
    return true;
  } catch (err: unknown) {
    console.error(`[analytics] Server track failed for ${name}:`, err);
    return false;
  }
}

/** Track a server-side revenue event. Revenue must be in dollars (not cents). */
export function trackServerRevenue(
  name: string,
  revenue: number,
  currency: string,
  data?: EventData,
  options?: string | ServerEventOptions,
): Promise<boolean> {
  return trackServer(name, { ...data, revenue, currency }, options);
}

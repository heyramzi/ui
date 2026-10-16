/**
 * Server-side Umami tracking via @umami/node.
 * Reliable for revenue and critical events — bypasses ad blockers.
 *
 * Requires `@umami/node` peer dependency.
 */

import type { EventData } from "#src/analytics/types.js";

type UmamiNodeClient = {
  track: (payload: Record<string, unknown>) => Promise<unknown>;
};

type UmamiNodeModule = {
  Umami: new (config: {
    hostUrl: string;
    websiteId: string;
    userAgent?: string;
  }) => UmamiNodeClient;
};

let client: UmamiNodeClient | null = null;

type ServerConfig = {
  hostUrl: string;
  websiteId: string;
  userAgent?: string;
};

let _config: ServerConfig | null = null;

/** Initialize the server-side Umami client. Call once at startup. */
export function initServer(config: ServerConfig): void {
  _config = config;
}

async function getClient(): Promise<UmamiNodeClient> {
  if (client) return client;
  if (!_config) throw new Error("Call initServer() before tracking events");

  const { Umami } = (await import("@umami/node")) as UmamiNodeModule;
  client = new Umami({
    hostUrl: _config.hostUrl,
    websiteId: _config.websiteId,
    userAgent: _config.userAgent ?? "Server",
  });
  return client;
}

/** Fire-and-forget server-side event tracking. Never throws. */
export function trackServer(name: string, data?: EventData, url?: string): void {
  const payload: { name: string; data?: EventData; url?: string } = { name };
  if (data) payload.data = data;
  if (url) payload.url = url;

  getClient()
    .then((c) => c.track(payload))
    .catch((err: unknown) => {
      console.error("[analytics] Server track failed:", err);
    });
}

/** Track a server-side revenue event. Revenue must be in dollars (not cents). */
export function trackServerRevenue(
  name: string,
  revenue: number,
  currency: string,
  data?: EventData,
  url?: string,
): void {
  trackServer(name, { ...data, revenue, currency }, url);
}

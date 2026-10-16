/**
 * Error capture over `fetch` for Convex, Workers, SvelteKit and extensions.
 * Apps Script builds with `./protocol` and sends through UrlFetchApp instead.
 */

import { buildErrorRequest, type CaptureInput } from "#src/errors/sentry/protocol.js";

export { buildErrorRequest, parseDsn, parseStack } from "#src/errors/sentry/protocol.js";
export type { CaptureInput, SentryRequest, SentryScalar } from "#src/errors/sentry/protocol.js";

/** Send one error. Never throws; a missing DSN is a silent no-op. */
export async function captureError(input: CaptureInput): Promise<void> {
  const req = buildErrorRequest(input);
  if (!req) return;
  try {
    await fetch(req.url, { method: "POST", headers: req.headers, body: req.body });
  } catch (err) {
    console.error("[errors] Sentry capture failed:", err);
  }
}

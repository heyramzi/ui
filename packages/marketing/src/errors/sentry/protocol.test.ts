import { describe, expect, it } from "vitest";
import { buildErrorRequest, parseDsn, parseStack } from "#src/errors/sentry/protocol.js";

const DSN = "https://abc123@o42.ingest.de.sentry.io/4507";

describe("parseDsn", () => {
  it("splits key, origin and project", () => {
    expect(parseDsn(DSN)).toEqual({
      publicKey: "abc123",
      origin: "https://o42.ingest.de.sentry.io",
      projectId: "4507",
    });
  });

  it("rejects junk", () => {
    expect(parseDsn("")).toBeNull();
    expect(parseDsn("https://o42.ingest.sentry.io/4507")).toBeNull();
  });
});

describe("parseStack", () => {
  it("returns V8 frames oldest first", () => {
    const stack = "Error: boom\n    at inner (app.js:10:5)\n    at app.js:20:1";
    expect(parseStack(stack)).toEqual([
      { filename: "app.js", lineno: 20, colno: 1 },
      { function: "inner", filename: "app.js", lineno: 10, colno: 5 },
    ]);
  });
});

describe("buildErrorRequest", () => {
  it("is null without a DSN", () => {
    expect(buildErrorRequest({ dsn: "", error: new Error("x") })).toBeNull();
  });

  it("builds a three-line envelope with the surface tag", () => {
    const req = buildErrorRequest({
      dsn: DSN,
      error: new TypeError("bad"),
      surface: "sync",
      tags: { plan: "pro", skip: null },
      user: { email: "a@b.c" },
      eventId: "f".repeat(32),
      now: 1_700_000_000_000,
    });
    expect(req?.url).toBe(
      "https://o42.ingest.de.sentry.io/api/4507/envelope/?sentry_key=abc123&sentry_version=7",
    );
    const [head, item, event] = (req?.body ?? "").split("\n").map((l) => JSON.parse(l));
    expect(head.event_id).toBe("f".repeat(32));
    expect(item).toEqual({ type: "event" });
    expect(event.tags).toEqual({ plan: "pro", surface: "sync" });
    expect(event.exception.values[0]).toMatchObject({ type: "TypeError", value: "bad" });
    expect(event.user).toEqual({ email: "a@b.c" });
    expect(event.timestamp).toBe(1_700_000_000);
  });

  it("accepts a thrown string", () => {
    const req = buildErrorRequest({ dsn: DSN, error: "plain" });
    const event = JSON.parse((req?.body ?? "").split("\n")[2]);
    expect(event.exception.values[0]).toEqual({ type: "Error", value: "plain" });
  });
});

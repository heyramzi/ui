import { describe, expect, it, vi } from "vitest";
import { isStaleChunk, reloadForStaleChunk, shouldReport } from "#src/errors/sentry/sveltekit.js";

describe("shouldReport", () => {
  it("never reports an error() throw", () => {
    expect(shouldReport({ kind: "app", error: { message: "Not yours" } })).toBe(false);
  });

  it("reports an unknown error", () => {
    expect(shouldReport({ kind: "unknown", error: new Error("boom") })).toBe(true);
  });

  it("reports a framework or validation error only from 500", () => {
    expect(shouldReport({ kind: "framework", error: { status: 404, message: "Not Found" } })).toBe(
      false,
    );
    expect(shouldReport({ kind: "validation", error: { status: 400, message: "Bad" } })).toBe(
      false,
    );
    expect(shouldReport({ kind: "framework", error: { status: 500, message: "Internal" } })).toBe(
      true,
    );
  });
});

describe("isStaleChunk", () => {
  it("matches the Chrome, Safari and Firefox wordings", () => {
    expect(isStaleChunk(new Error("Failed to fetch dynamically imported module: /a.js"))).toBe(true);
    expect(isStaleChunk(new Error("Importing a module script failed."))).toBe(true);
    expect(isStaleChunk(new Error("error loading dynamically imported module: /a.js"))).toBe(true);
  });

  it("leaves other errors alone", () => {
    expect(isStaleChunk(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isStaleChunk("Failed to fetch dynamically imported module")).toBe(false);
  });
});

function fakeEnv(startAt: number) {
  const store = new Map<string, string>();
  let clock = startAt;
  const reload = vi.fn();
  return {
    env: {
      storage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => void store.set(key, value),
      },
      now: () => clock,
      reload,
    },
    reload,
    advance: (ms: number) => (clock += ms),
  };
}

describe("reloadForStaleChunk", () => {
  it("reloads once, then stops so a chunk that's really gone can't loop", () => {
    const { env, reload, advance } = fakeEnv(1_000_000);
    expect(reloadForStaleChunk(env)).toBe(true);
    advance(5_000);
    expect(reloadForStaleChunk(env)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("reloads again for a later deploy", () => {
    const { env, reload, advance } = fakeEnv(1_000_000);
    reloadForStaleChunk(env);
    advance(60_000);
    expect(reloadForStaleChunk(env)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });

  it("doesn't reload when storage is blocked", () => {
    const reload = vi.fn();
    const blocked = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {},
    };
    expect(reloadForStaleChunk({ storage: blocked, now: Date.now, reload })).toBe(false);
    expect(reloadForStaleChunk(null)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});

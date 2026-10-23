import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  backendOf,
  FEATURES_OFF,
  gateOpen,
  hostPost,
  isOpenScreen,
  pairBody,
  pairProblem,
  readFeatures,
  resultText,
  secondsToMs,
} from "#src/core/openscreen.js";

/** A stub for one studio route, so no test ever waits on Worker C. */
function route(status: number, body: unknown): void {
  vi.stubGlobal("fetch", async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 404 ? "Not Found" : status === 500 ? "Internal Server Error" : "",
    json: async () => body,
  }));
}

afterEach(() => vi.unstubAllGlobals());

describe("openscreen gate", () => {
  it("stays shut until the studio says it is on", () => {
    expect(gateOpen(null)).toBe(false);
    expect(gateOpen(FEATURES_OFF)).toBe(false);
    expect(gateOpen({ openscreen: false, openscreenInstalled: true })).toBe(false);
    expect(gateOpen({ openscreen: true, openscreenInstalled: false })).toBe(true);
  });
  it("reads a features body without trusting its shape", () => {
    expect(readFeatures({ openscreen: true, openscreenInstalled: true })).toEqual({
      openscreen: true,
      openscreenInstalled: true,
    });
    expect(readFeatures("nope")).toEqual(FEATURES_OFF);
    expect(readFeatures({ openscreen: "yes" })).toEqual(FEATURES_OFF);
  });
  it("lights the project actions only on an OpenScreen model", () => {
    expect(isOpenScreen({ backend: "openscreen" })).toBe(true);
    expect(isOpenScreen({ backend: "descript" })).toBe(false);
    expect(isOpenScreen({})).toBe(false);
    expect(isOpenScreen(null)).toBe(false);
  });
  it("reads the backend off the model, defaulting to Descript", () => {
    expect(backendOf({ backend: "openscreen" })).toBe("openscreen");
    expect(backendOf({ backend: "local" })).toBe("local");
    expect(backendOf({})).toBe("descript");
  });
});

describe("offset in seconds", () => {
  it("converts seconds to whole milliseconds", () => {
    expect(secondsToMs("0")).toBe(0);
    expect(secondsToMs(1.5)).toBe(1500);
    expect(secondsToMs("2.25")).toBe(2250);
    expect(secondsToMs("-1.2")).toBe(-1200);
  });
  it("treats a blank or unreadable value as no offset", () => {
    expect(secondsToMs("")).toBe(0);
    expect(secondsToMs("   ")).toBe(0);
    expect(secondsToMs(null)).toBe(0);
    expect(secondsToMs(undefined)).toBe(0);
    expect(secondsToMs("later")).toBe(0);
    expect(secondsToMs(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("pair form", () => {
  const full = { name: " Demo ", screen: " /a/screen.mp4 ", camera: "/a/cam.mp4", offset: "0.5" };
  it("sends trimmed fields and the offset in milliseconds", () => {
    expect(pairBody(full)).toEqual({
      name: "Demo",
      screen: "/a/screen.mp4",
      camera: "/a/cam.mp4",
      offsetMs: 500,
    });
  });
  it("asks for a name, then a screen file", () => {
    expect(pairProblem({ name: "", screen: "/a/screen.mp4" })).toBe("Name the video first.");
    expect(pairProblem({ name: "Demo", screen: "" })).toBe("Add the screen recording.");
    expect(pairProblem({ name: "Demo", screen: "/a/screen.mp4" })).toBe("");
  });
});

describe("a route's answer", () => {
  it("shows the route's own error text", () => {
    expect(resultText({ ok: false, error: "Openscreen export failed: no video track" })).toBe(
      "Openscreen export failed: no video track",
    );
    expect(resultText({ ok: false, error: "" })).toBe("That didn't work.");
    expect(resultText({ ok: true })).toBe("");
    expect(resultText(null)).toBe("");
  });
});

describe("posting a studio route", () => {
  it("takes the pair route's answer as it is", async () => {
    route(200, { ok: true });
    expect(await hostPost("/projects/openscreen/pair", { name: "Demo" })).toEqual({ ok: true });
  });
  it("shows the route's error text, like feature off", async () => {
    route(404, { error: "feature off" });
    expect(await hostPost("/projects/openscreen/pair", { name: "Demo" })).toEqual({
      ok: false,
      error: "feature off",
    });
  });
  it("reads a bare 2xx as success, so a route that says {} still works", async () => {
    route(200, {});
    expect(await hostPost("/projects/openscreen/record", { name: "Demo" })).toEqual({ ok: true });
  });
  it("reads a status with no body as a failure", async () => {
    route(500, null);
    expect(await hostPost("/projects/openscreen/export", { name: "Demo" })).toEqual({
      ok: false,
      error: "Internal Server Error",
    });
  });
  it("says so when the studio can't be reached", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    expect(await hostPost("/projects/openscreen/sync", { name: "Demo" })).toEqual({
      ok: false,
      error: "Couldn't reach the studio.",
    });
  });
});

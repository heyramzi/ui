import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { registerBorderBeamProperties } from "#src/effects/border-beam/register-properties.js";

const originalCss = globalThis.CSS;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "CSS", {
    configurable: true,
    value: originalCss,
  });
});

describe("registerBorderBeamProperties", () => {
  test("registers angle and opacity properties for md beams", () => {
    const registerProperty = vi.fn();
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: { registerProperty },
    });

    registerBorderBeamProperties("bb-test", "md");

    expect(registerProperty).toHaveBeenCalledWith({
      name: "--beam-angle-bb-test",
      syntax: "<angle>",
      initialValue: "0deg",
      inherits: true,
    });
    expect(registerProperty).toHaveBeenCalledWith({
      name: "--beam-opacity-bb-test",
      syntax: "<number>",
      initialValue: "0",
      inherits: true,
    });
  });

  test("registers line beam numeric properties", () => {
    const registerProperty = vi.fn();
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: { registerProperty },
    });

    registerBorderBeamProperties("bb-line", "line");

    expect(registerProperty).toHaveBeenCalledWith({
      name: "--beam-x-bb-line",
      syntax: "<number>",
      initialValue: "0",
      inherits: true,
    });
    expect(registerProperty).toHaveBeenCalledWith({
      name: "--beam-edge-bb-line",
      syntax: "<number>",
      initialValue: "1",
      inherits: true,
    });
    expect(registerProperty).toHaveBeenCalledTimes(7);
  });

  test("ignores unsupported or duplicate registrations", () => {
    const registerProperty = vi.fn(() => {
      throw new Error("already registered");
    });
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: { registerProperty },
    });

    expect(() => registerBorderBeamProperties("bb-test", "sm")).not.toThrow();
    expect(registerProperty).toHaveBeenCalledTimes(2);
  });
});

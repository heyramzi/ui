import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const cuelume = vi.hoisted(() => ({
  bind: vi.fn(() => () => {}),
  play: vi.fn(),
  setEnabled: vi.fn(),
  unlock: vi.fn(() => Promise.resolve(true)),
}));
vi.mock("cuelume", () => cuelume);

// The module holds the setting and the silence count, so each test loads a fresh copy.
async function load() {
  vi.resetModules();
  return import("#src/lib/sound.js");
}

function lastEnabled(): unknown {
  return cuelume.setEnabled.mock.calls.at(-1)?.[0];
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
  for (const fn of Object.values(cuelume)) fn.mockClear();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("markSlots", () => {
  it("gives each kit control the binding for its job", async () => {
    const { markSlots } = await load();
    document.body.innerHTML = `
      <button data-slot="button">Save</button>
      <button data-slot="switch"></button>
      <button data-slot="dropdown-menu-trigger"></button>
      <button data-slot="code-block-copy-button"></button>
      <input data-slot="input" />`;
    markSlots(document);
    const [button, sw, menu, copy, input] = document.body.children;
    expect(button.getAttribute("data-cuelume-tap")).toBe("");
    expect(sw.hasAttribute("data-cuelume-toggle")).toBe(true);
    expect(menu.hasAttribute("data-cuelume-open")).toBe(true);
    expect(menu.getAttribute("data-cuelume-emphasis")).toBe("subtle");
    expect(copy.getAttribute("data-cuelume-tap")).toBe("success");
    // Text fields stay quiet unless the app opts one in.
    expect(input.getAttributeNames().some((n) => n.startsWith("data-cuelume-"))).toBe(false);
  });

  it("leaves a control alone that names its own cue or sits under data-sound=off", async () => {
    const { markSlots } = await load();
    document.body.innerHTML = `
      <button data-slot="button" data-cuelume-close="">Delete</button>
      <div data-sound="off"><button data-slot="button">Quiet</button></div>`;
    markSlots(document);
    const [own, quiet] = document.querySelectorAll("button");
    expect(own.hasAttribute("data-cuelume-tap")).toBe(false);
    expect(quiet.hasAttribute("data-cuelume-tap")).toBe(false);
  });
});

describe("startSound", () => {
  it("binds the root and marks controls that mount later", async () => {
    const { startSound } = await load();
    const stop = startSound(document);
    expect(cuelume.bind).toHaveBeenCalledWith(document);
    const later = document.createElement("button");
    later.setAttribute("data-slot", "tabs-trigger");
    document.body.append(later);
    await Promise.resolve();
    expect(later.hasAttribute("data-cuelume-select")).toBe(true);
    stop();
  });

  it("starts muted when nothing was saved", async () => {
    const { startSound, soundOn } = await load();
    startSound(document)();
    expect(soundOn()).toBe(false);
    expect(lastEnabled()).toBe(false);
  });

  it("starts audible when the person turned sound on before", async () => {
    localStorage.setItem("heyramzi:sound", "on");
    const { startSound } = await load();
    startSound(document)();
    expect(lastEnabled()).toBe(true);
  });
});

describe("setSound, silence and cue", () => {
  it("saves the choice and unlocks audio only when turning on", async () => {
    const { setSound } = await load();
    await expect(setSound(true)).resolves.toBe(true);
    expect(localStorage.getItem("heyramzi:sound")).toBe("on");
    expect(cuelume.unlock).toHaveBeenCalledOnce();
    await expect(setSound(false)).resolves.toBe(false);
    expect(localStorage.getItem("heyramzi:sound")).toBe("off");
    expect(cuelume.unlock).toHaveBeenCalledOnce();
  });

  it("mutes while any hold is open, and a second release changes nothing", async () => {
    const { setSound, silence, cue } = await load();
    await setSound(true);
    const first = silence();
    const second = silence();
    cue("success");
    expect(cuelume.play).not.toHaveBeenCalled();
    first();
    first();
    expect(lastEnabled()).toBe(false);
    second();
    expect(lastEnabled()).toBe(true);
    cue("success", { emphasis: "strong" });
    expect(cuelume.play).toHaveBeenCalledWith("success", { emphasis: "strong" });
  });

  it("plays nothing while sound is off", async () => {
    const { cue } = await load();
    cue("error");
    expect(cuelume.play).not.toHaveBeenCalled();
  });
});

import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { SoundCard } from "#src/core/types.js";
import { must } from "#src/test-support.js";
import SoundLibrary from "#src/ui/SoundLibrary.svelte";

const sound = (id: string, over: Partial<SoundCard> = {}): SoundCard => ({
  id,
  name: id,
  group: "Whoosh",
  src: `/sounds/media/${id}`,
  seconds: 0.604,
  gain: 0.1648,
  ...over,
});

let app: ReturnType<typeof mount> | undefined;
const draw = (sounds: SoundCard[]) => {
  document.body.innerHTML = "";
  app = mount(SoundLibrary, { target: document.body, props: { sounds } });
  flushSync();
};
const buttons = (label: RegExp) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].filter((b) =>
    label.test(b.getAttribute("aria-label") ?? ""),
  );

let play: ReturnType<typeof vi.fn>;
beforeEach(() => {
  play = vi.fn(async () => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(play as never);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => {
  if (app) void unmount(app);
  app = undefined;
  vi.restoreAllMocks();
});

describe("SoundLibrary", () => {
  it("groups sounds in the roster's order and counts each group", () => {
    draw([sound("whoosh"), sound("impact", { group: "Impact" }), sound("swish")]);
    const heads = [...document.querySelectorAll("h2")].map((h) =>
      h.textContent?.replace(/\s+/g, " ").trim(),
    );
    expect(heads).toEqual(["Whoosh 2", "Impact 1"]);
  });

  it("shows the roster's own use-when line and invents none", () => {
    draw([sound("whoosh", { job: "The transition." }), sound("tick")]);
    const cards = [...document.querySelectorAll("li")];
    expect(cards[0]?.querySelector(".job")?.textContent).toBe("The transition.");
    expect(cards[1]?.querySelector(".job")).toBeNull();
  });

  it("gives each card one title row with its length, and no gain line", () => {
    draw([sound("whoosh"), sound("pop", { seconds: 32.708, gain: null })]);
    const heads = [...document.querySelectorAll(".head")].map((m) =>
      m.textContent?.replace(/\s+/g, " ").trim(),
    );
    expect(heads).toEqual(["Whoosh 0.60 s", "Pop 32.7 s"]);
    expect(document.querySelector(".meta")).toBeNull();
  });

  it("plays one sound at a time and stops it on a second press", () => {
    draw([sound("whoosh"), sound("swish")]);
    const [first, second] = buttons(/^Play /);
    first?.click();
    flushSync();
    expect(play).toHaveBeenCalledTimes(1);
    expect(buttons(/^Pause Whoosh/)).toHaveLength(1);
    second?.click();
    flushSync();
    expect(buttons(/^Pause Whoosh/)).toHaveLength(0);
    expect(buttons(/^Pause Swish/)).toHaveLength(1);
    buttons(/^Pause Swish/)[0]?.click();
    flushSync();
    expect(buttons(/^Pause /)).toHaveLength(0);
  });

  it("disables play for a sound with no file on this machine", () => {
    draw([sound("gone", { src: undefined })]);
    expect(buttons(/^Play Gone/)[0]?.disabled).toBe(true);
  });

  it("copies the card's agent text and shows the check", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    draw([sound("whoosh", { agent: "Sound: whoosh" }), sound("swish")]);
    expect(buttons(/^Copy /)).toHaveLength(1);
    buttons(/^Copy Whoosh/)[0]?.click();
    await Promise.resolve();
    await Promise.resolve();
    flushSync();
    expect(writeText).toHaveBeenCalledWith("Sound: whoosh");
    expect(document.querySelector(".spark.done")).not.toBeNull();
  });

  it("filters by name, group and job", () => {
    draw([sound("whoosh", { job: "The transition." }), sound("pop", { group: "Pop" })]);
    const input = must(
      document.querySelector<HTMLInputElement>("input[type=search]"),
      "the search field",
    );
    input.value = "transition";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(document.querySelectorAll("li")).toHaveLength(1);
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    expect(document.querySelector(".none")?.textContent).toContain("Nothing matches");
  });

  it("shows the plain name, and words the id when the host named none", () => {
    draw([sound("whoosh-deep", { name: "Deep whoosh" }), sound("air-out")]);
    const titles = [...document.querySelectorAll("li b")].map((b) => b.textContent);
    expect(titles).toEqual(["Deep whoosh", "Air out"]);
    expect(document.body.textContent).not.toContain("whoosh-deep");
    expect(buttons(/Play Deep whoosh/)).toHaveLength(1);
  });

  it("draws an empty state with the next step and no search box for an empty roster", () => {
    draw([]);
    expect(document.querySelector("input")).toBeNull();
    expect(document.querySelector(".none")?.textContent).toContain("Your agent can add");
  });
});

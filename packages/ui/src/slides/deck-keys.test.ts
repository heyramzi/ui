import { afterEach, describe, expect, it } from "vite-plus/test";
import { flushSync, mount, unmount } from "svelte";
import Demo from "#src/slides/demo.svelte";

let app: ReturnType<typeof mount> | null = null;

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = "";
});

const said = () => document.querySelector(".deck__sr")?.textContent?.trim();

function press(target: EventTarget, key: string) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  flushSync();
}

describe("a deck's keys", () => {
  it("ignores keys pressed outside it, even as the only deck on the page", () => {
    app = mount(Demo, { target: document.body.appendChild(document.createElement("div")) });
    flushSync();
    const before = said();
    press(document.body, "ArrowRight");
    press(document.body, " ");
    expect(said()).toBe(before);
  });

  it("pages when focus is inside it", () => {
    app = mount(Demo, { target: document.body.appendChild(document.createElement("div")) });
    flushSync();
    const deck = document.querySelector<HTMLElement>(".deck");
    if (!deck) throw new Error("no deck rendered");
    deck.focus();
    const before = said();
    press(deck, "End");
    expect(said()).not.toBe(before);
  });
});

import { afterEach, describe, expect, it } from "vite-plus/test";
import { flushSync, mount, unmount } from "svelte";
import Deck from "#src/slides/Deck.svelte";

let app: ReturnType<typeof mount> | null = null;

/* An empty registry draws each slide as its "unknown type" fallback, enough to page through. */
const slides = ["one", "two", "three"].map((id) => ({ id, type: "plain", content: null }));

function mountDeck() {
  app = mount(Deck, {
    target: document.body.appendChild(document.createElement("div")),
    props: { id: "keys", title: "Keys", slides, registry: {} },
  });
  flushSync();
}

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
    mountDeck();
    const before = said();
    press(document.body, "ArrowRight");
    press(document.body, " ");
    expect(said()).toBe(before);
  });

  it("pages when focus is inside it", () => {
    mountDeck();
    const deck = document.querySelector<HTMLElement>(".deck");
    if (!deck) throw new Error("no deck rendered");
    deck.focus();
    const before = said();
    press(deck, "End");
    expect(said()).not.toBe(before);
  });
});

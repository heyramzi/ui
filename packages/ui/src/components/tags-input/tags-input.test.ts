import { flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import TagsInput from "#src/components/tags-input/tags-input.svelte";

async function render(start: string[]) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  // The field shows `pending` while a save runs, then reads `value` again, so a getter is enough here.
  let saved = start;
  const app = mount(TagsInput, {
    target,
    props: {
      get value() {
        return saved;
      },
      onchange: (next: string[]) => {
        saved = next;
      },
      label: "Tools",
      free: true,
    },
  });
  flushSync();
  const key = async (k: string) => {
    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }),
    );
    flushSync();
    await tick();
  };
  const chips = () => [
    ...target.querySelectorAll<HTMLButtonElement>("[data-slot=tag-chip] button"),
  ];
  return {
    target,
    key,
    chips,
    focused: () =>
      document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

// The 10 Nov audit: the remove buttons skipped the Tab order, so only the last tag could go.
describe("TagsInput keyboard", () => {
  it("names the field with its tags at rest", async () => {
    const { target, done } = await render(["Airtable", "Make"]);
    expect(target.querySelector("button")?.getAttribute("aria-label")).toBe(
      "Tools: Airtable, Make",
    );
    done();
  });

  it("walks the chips with the arrows and removes the focused one", async () => {
    const { target, key, chips, focused, done } = await render(["Airtable", "Make", "Zapier"]);
    target.querySelector("button")?.click();
    flushSync();
    await tick();
    expect(focused()).toBe("Tools");
    await key("ArrowLeft");
    expect(focused()).toBe("Remove Zapier");
    await key("ArrowLeft");
    await key("ArrowLeft");
    expect(focused()).toBe("Remove Airtable");
    await key("Delete");
    expect(chips().map((b) => b.getAttribute("aria-label"))).toEqual([
      "Remove Make",
      "Remove Zapier",
    ]);
    expect(focused()).toBe("Remove Make");
    expect(target.querySelector("[role=status]")?.textContent).toBe("Removed Airtable");
    await key("ArrowRight");
    await key("ArrowRight");
    expect(focused()).toBe("Tools");
    done();
  });

  it("announces an added tag and goes back to the box on Escape from a chip", async () => {
    const { target, key, focused, done } = await render(["Make"]);
    target.querySelector("button")?.click();
    flushSync();
    await tick();
    const input = target.querySelector("input") as HTMLInputElement;
    input.value = "Notion";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    await key("Enter");
    expect(target.querySelector("[role=status]")?.textContent).toBe("Added Notion");
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();
    await key("ArrowLeft");
    expect(focused()).toBe("Remove Notion");
    await key("Escape");
    expect(focused()).toBe("Tools");
    done();
  });
});

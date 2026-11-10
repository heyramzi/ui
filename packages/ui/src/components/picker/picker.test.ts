import { createRawSnippet, flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it, vi } from "vite-plus/test";
import Picker from "#src/components/picker/picker.svelte";

const trigger = createRawSnippet(() => ({ render: () => `<span>Priority</span>` }));
const options = ["Urgent", "High", "Medium", "Low"].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

async function render() {
  const onSelect = vi.fn();
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(Picker<string>, {
    target,
    props: { options, value: null, onSelect, trigger, triggerLabel: "Priority" },
  });
  flushSync();
  target.querySelector("button")?.click();
  await settle();
  const press = async (key: string) => {
    document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    await settle();
  };
  const highlighted = () =>
    document.querySelector('[data-slot="command-item"][aria-selected="true"]')?.textContent?.trim();
  return {
    onSelect,
    press,
    highlighted,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

async function settle() {
  for (let i = 0; i < 4; i++) await tick();
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

// 10 Nov 2026: under seven rows there's no search field, and focus sat outside the Command root.
describe("Picker keyboard without a search field", () => {
  it("takes focus into the list so arrows, Home, End and Enter work", async () => {
    const { onSelect, press, highlighted, done } = await render();
    expect(document.activeElement?.getAttribute("data-slot")).toBe("command");
    expect(highlighted()).toBe("Urgent");
    await press("ArrowDown");
    expect(highlighted()).toBe("High");
    await press("End");
    expect(highlighted()).toBe("Low");
    await press("Home");
    expect(highlighted()).toBe("Urgent");
    await press("ArrowDown");
    await press("Enter");
    expect(onSelect).toHaveBeenCalledWith("high");
    done();
  });

  it("jumps to the next row starting with a typed letter", async () => {
    const { press, highlighted, done } = await render();
    await press("l");
    expect(highlighted()).toBe("Low");
    await press("m");
    expect(highlighted()).toBe("Medium");
    done();
  });
});

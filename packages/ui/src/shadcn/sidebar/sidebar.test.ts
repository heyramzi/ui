import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it, vi } from "vite-plus/test";
import SidebarProvider from "#src/shadcn/sidebar/sidebar-provider.svelte";
import SidebarTrigger from "#src/shadcn/sidebar/sidebar-trigger.svelte";

function renderProvider() {
  const onOpenChange = vi.fn();
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(SidebarProvider, { target, props: { onOpenChange } });
  flushSync();
  const press = (key: string, from: EventTarget = document.body) => {
    from.dispatchEvent(new KeyboardEvent("keydown", { key, metaKey: true, bubbles: true }));
    flushSync();
  };
  return {
    target,
    onOpenChange,
    press,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

// 10 Nov 2026: Cmd+S toggled the sidebar and swallowed the browser's save, even mid-typing.
describe("Sidebar shortcut", () => {
  it("toggles on Cmd+B and leaves Cmd+S to the browser", () => {
    const { onOpenChange, press, done } = renderProvider();
    const save = new KeyboardEvent("keydown", { key: "s", metaKey: true, cancelable: true });
    window.dispatchEvent(save);
    expect(save.defaultPrevented).toBe(false);
    expect(onOpenChange).not.toHaveBeenCalled();
    press("b");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    done();
  });

  it("leaves Cmd+B alone while typing in a field", () => {
    const { target, onOpenChange, press, done } = renderProvider();
    const input = document.createElement("input");
    const textarea = document.createElement("textarea");
    const editable = document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    target.append(input, textarea, editable);
    for (const field of [input, textarea, editable]) press("b", field);
    expect(onOpenChange).not.toHaveBeenCalled();
    done();
  });
});

describe("SidebarTrigger", () => {
  it("reports whether the sidebar is open and which element it controls", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const sidebar = { expanded: true, id: "sidebar-s1", toggle: vi.fn() };
    const app = mount(SidebarTrigger, {
      target,
      context: new Map([[Symbol.for("scn-sidebar"), sidebar]]),
    });
    flushSync();
    const button = target.querySelector("button");
    expect(button?.getAttribute("aria-expanded")).toBe("true");
    expect(button?.getAttribute("aria-controls")).toBe("sidebar-s1");
    void unmount(app);
    target.remove();
  });
});

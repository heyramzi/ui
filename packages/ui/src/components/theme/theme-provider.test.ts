import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { setMode, toggleMode } from "mode-watcher";
import ThemeProvider from "#src/components/theme/theme-provider.svelte";

function render(props: Record<string, unknown>) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(ThemeProvider, { target, props });
  flushSync();
  return () => {
    void unmount(app);
    target.remove();
  };
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    // WHY: jsdom has no matchMedia, and the watcher asks it for the system mode on mount.
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      }),
    });
  });
  afterEach(() => document.documentElement.classList.remove("dark"));

  it("takes the server's choice when nothing is stored", () => {
    const done = render({ initial: "dark", disableHeadScriptInjection: true });
    flushSync();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    done();
  });

  it("lets a stored choice beat the server's", () => {
    localStorage.setItem("mode-watcher-mode", "light");
    const done = render({ initial: "dark", disableHeadScriptInjection: true });
    flushSync();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    done();
  });

  it("reports a person's choice and not the load", () => {
    const onChange = vi.fn();
    const done = render({ initial: "light", onChange, disableHeadScriptInjection: true });
    flushSync();
    expect(onChange).not.toHaveBeenCalled();
    setMode("dark");
    flushSync();
    expect(onChange).toHaveBeenLastCalledWith("dark");
    toggleMode();
    flushSync();
    expect(onChange).toHaveBeenLastCalledWith("light");
    done();
  });
});

import { flushSync, mount, unmount } from "svelte";
import { Check } from "phosphor-svelte";
import { describe, expect, it } from "vite-plus/test";
import StatusBadge from "#src/status/status-badge.svelte";
import StatusIcon from "#src/status/status-icon.svelte";
import { defineStatuses } from "#src/status/define-statuses.js";

const statuses = defineStatuses({
  done: { label: "Done", tone: "success", icon: Check },
  open: { label: "Open", tone: "neutral" },
});

function render(start: (target: HTMLElement) => Record<string, unknown>) {
  const target = document.createElement("div");
  const app = start(target);
  flushSync();
  return { target, done: () => void unmount(app) };
}

// The 10 Nov audit: the busy spinner was hidden with nothing in its place, and a lone status icon had no name.
describe("status names", () => {
  it("says the busy state after the label while the spinner stays hidden", () => {
    const { target, done } = render((target) =>
      mount(StatusBadge, { target, props: { statuses, status: "open", busy: true } }),
    );
    expect(target.textContent?.replace(/\s+/g, " ").trim()).toBe("Open, working");
    expect(target.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    done();
  });

  it("names a status icon only when given a label", () => {
    const named = render((target) =>
      mount(StatusIcon, { target, props: { statuses, status: "done", label: "Done" } }),
    );
    expect(named.target.querySelector("span[role=img]")?.getAttribute("aria-label")).toBe("Done");
    named.done();
    const plain = render((target) =>
      mount(StatusIcon, { target, props: { statuses, status: "done" } }),
    );
    expect(plain.target.querySelector("span[role=img]")).toBeNull();
    expect(plain.target.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    plain.done();
  });
});

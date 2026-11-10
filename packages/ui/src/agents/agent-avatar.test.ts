import { afterEach, describe, expect, it } from "vite-plus/test";
import { flushSync, mount, unmount } from "svelte";
import AgentAvatar from "#src/agents/agent-avatar.svelte";

// jsdom has no canvas paths; the avatar builds its body shape with one while it mounts.
globalThis.Path2D ??= class {} as unknown as typeof Path2D;

let app: ReturnType<typeof mount> | null = null;

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = "";
});

function render(props: Record<string, unknown>) {
  app = mount(AgentAvatar, { target: document.body, props: { size: 48, ...props } as never });
  flushSync();
  return document.querySelector<HTMLElement>(".agent-avatar");
}

describe("AgentAvatar's host", () => {
  it("is a named button when the caller attaches an action", () => {
    let clicks = 0;
    const host = render({ name: "Ada", role: "Researcher", onclick: () => clicks++ });
    expect(host?.tagName).toBe("BUTTON");
    expect(host?.getAttribute("type")).toBe("button");
    expect(host?.getAttribute("aria-label")).toBe("Ada, Researcher");
    host?.click();
    expect(clicks).toBe(1);
  });

  it("stays a plain span when the jump is the only thing a click does", () => {
    expect(render({ name: "Ada" })?.tagName).toBe("SPAN");
  });

  it("stays a span inside a parent control that hides it", () => {
    expect(render({ name: "Ada", onclick: () => {}, "aria-hidden": true })?.tagName).toBe("SPAN");
  });
});

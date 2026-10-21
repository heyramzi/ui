import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { flushSync, mount, unmount } from "svelte";
import PenField from "#src/canvas/pen/PenField.svelte";
import HostField from "#src/canvas/pen/host-field.test.svelte";
import { TEXT_FIELD_KEY, type TextFieldComponent } from "#src/canvas/editor/text-field-context.js";

let app: ReturnType<typeof mount> | null = null;
const target = () => document.body.appendChild(document.createElement("div"));

function mountField(props: Record<string, unknown>, host?: TextFieldComponent) {
  app = mount(PenField, {
    target: target(),
    props: {
      value: "**hi**",
      variant: "text",
      ariaLabel: "Text",
      onCommit: () => {},
      ...props,
    } as never,
    ...(host && { context: new Map([[TEXT_FIELD_KEY, host]]) }),
  });
  flushSync();
  return app as unknown as { edit: (point?: { x: number; y: number }) => void };
}

afterEach(() => {
  if (app) unmount(app);
  app = null;
  document.body.innerHTML = "";
});

describe("the pen's text field slot", () => {
  it("draws a plain textarea when the host gave no field", () => {
    mountField({});
    const area = document.querySelector("textarea");
    expect(area?.value).toBe("**hi**");
    expect(document.querySelector("[data-host-field]")).toBeNull();
  });

  it("writes typing through onCommit as a live edit", () => {
    const onCommit = vi.fn();
    mountField({ onCommit });
    const area = document.querySelector("textarea") as HTMLTextAreaElement;
    area.value = "new words";
    area.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onCommit).toHaveBeenCalledWith("new words", true);
  });

  it("keeps the textarea read-only where the canvas can't edit", () => {
    mountField({ readonly: true });
    expect((document.querySelector("textarea") as HTMLTextAreaElement).readOnly).toBe(true);
  });

  it("opens the textarea on edit() and reports the close", () => {
    const onExit = vi.fn();
    const field = mountField({ onExit });
    field.edit();
    const area = document.querySelector("textarea") as HTMLTextAreaElement;
    expect(document.activeElement).toBe(area);
    area.blur();
    expect(onExit).toHaveBeenCalledOnce();
  });

  it("renders the host's field in place of the textarea when one is given", () => {
    mountField({ variant: "label" }, HostField as unknown as TextFieldComponent);
    expect(document.querySelector("textarea")).toBeNull();
    const host = document.querySelector("[data-host-field]");
    expect(host?.textContent).toBe("**hi**");
    expect(host?.className).toContain("pen-field is-label");
  });

  it("hands edit() to the host's field, and never to a read-only one", () => {
    const field = mountField({}, HostField as unknown as TextFieldComponent);
    field.edit();
    flushSync();
    expect(document.querySelector("[data-host-field]")?.getAttribute("data-opened")).toBe("1");
    if (app) unmount(app);
    const locked = mountField({ readonly: true }, HostField as unknown as TextFieldComponent);
    locked.edit();
    flushSync();
    expect(
      document
        .querySelector("[data-host-field][data-readonly='true']")
        ?.getAttribute("data-opened"),
    ).toBe("0");
  });
});

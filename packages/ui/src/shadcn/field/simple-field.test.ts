import { createRawSnippet, flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import SimpleField from "#src/shadcn/field/simple-field.svelte";

const input = createRawSnippet(() => ({ render: () => `<input id="email" />` }));

function render(props: { error?: string; description?: string }) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(SimpleField, { target, props: { label: "Email", for: "email", children: input, ...props } });
  flushSync();
  return {
    target,
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

describe("SimpleField", () => {
  it("links the error to its input and marks it invalid", () => {
    const { target, done } = render({ error: "Enter a valid email" });
    const control = target.querySelector("input")!;
    const message = target.querySelector("[data-slot=field-error]")!;
    expect(message.textContent).toContain("Enter a valid email");
    expect(message.getAttribute("role")).toBe("alert");
    expect(control.getAttribute("aria-describedby")).toBe(message.id);
    expect(control.getAttribute("aria-invalid")).toBe("true");
    done();
  });

  it("links the description when there is no error", () => {
    const { target, done } = render({ description: "We never share it" });
    const control = target.querySelector("input")!;
    const message = target.querySelector("[data-slot=field-description]")!;
    expect(control.getAttribute("aria-describedby")).toBe(message.id);
    expect(control.hasAttribute("aria-invalid")).toBe(false);
    done();
  });

  it("leaves the input alone when there is nothing to say", () => {
    const { target, done } = render({});
    expect(target.querySelector("input")!.hasAttribute("aria-describedby")).toBe(false);
    done();
  });
});

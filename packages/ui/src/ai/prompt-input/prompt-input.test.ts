import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import PromptInputSubmit, {
  type PromptInputStatus,
} from "#src/ai/prompt-input/PromptInputSubmit.svelte";
import PromptInputTextarea from "#src/ai/prompt-input/PromptInputTextarea.svelte";

function render(status: PromptInputStatus) {
  const form = document.createElement("form");
  const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
  form.addEventListener("submit", onSubmit);
  document.body.appendChild(form);
  const textarea = mount(PromptInputTextarea, { target: form, props: {} });
  const submit = mount(PromptInputSubmit, { target: form, props: { status } });
  flushSync();
  const field = form.querySelector("textarea");
  if (!field) throw new Error("PromptInputTextarea rendered no textarea");
  return {
    field,
    onSubmit,
    enter: () => field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    done: () => {
      void unmount(textarea);
      void unmount(submit);
      form.remove();
    },
  };
}

const errors: unknown[] = [];
const onError = (event: ErrorEvent) => {
  errors.push(event.error);
  event.preventDefault();
};

afterEach(() => {
  window.removeEventListener("error", onError);
  errors.length = 0;
});

describe("PromptInputTextarea Enter", () => {
  it("submits when ready", () => {
    const { onSubmit, enter, done } = render("ready");
    enter();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    done();
  });

  // 10 Nov 2026: Enter mid-reply handed requestSubmit the Stop button, and it threw a TypeError.
  it("does nothing while a reply is generating", () => {
    window.addEventListener("error", onError);
    const { onSubmit, enter, done } = render("streaming");
    enter();
    expect(errors).toEqual([]);
    expect(onSubmit).not.toHaveBeenCalled();
    done();
  });

  it("is named Message by default", () => {
    const { field, done } = render("ready");
    expect(field.getAttribute("aria-label")).toBe("Message");
    done();
  });
});

import { flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import Thread from "#src/thread/thread.svelte";
import { DEFAULT_THREAD_LABELS, type ThreadComment } from "#src/thread/types.js";

const ada = { kind: "user", name: "Ada" } as const;

function comment(id: string, minute: number): ThreadComment {
  return { id, author: ada, body: `Body ${id}`, createdAt: `2026-10-22T10:0${minute}:00Z` };
}

function render() {
  const props = $state({
    comments: [comment("a", 0), comment("b", 1), comment("c", 2)],
    canEdit: () => true,
    onPost: () => {},
    onEdit: () => {},
    onDelete: (gone: ThreadComment) => {
      props.comments = props.comments.filter((c) => c.id !== gone.id);
    },
  });
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(Thread, { target, props });
  flushSync();
  const q = <E extends Element = HTMLElement>(selector: string) =>
    target.querySelector(selector) as E | null;
  return {
    q,
    press: (key: string) =>
      document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true })),
    done: () => {
      void unmount(app);
      target.remove();
    },
  };
}

async function settle() {
  for (let i = 0; i < 4; i++) await tick();
  flushSync();
}

const { edit, cancel, save, reply } = DEFAULT_THREAD_LABELS;

describe("Thread focus", () => {
  it("moves focus into the edit box, and back to Edit on Esc, Cancel and Save", async () => {
    const { q, press, done } = render();
    const editOf = () => q(`[data-comment="b"] [aria-label="${edit}"]`);
    for (const close of ["Escape", cancel, save]) {
      editOf()?.click();
      await settle();
      expect(document.activeElement).toBe(q('[data-thread-edit-box="b"]'));
      if (close === "Escape") press("Escape");
      else
        [...document.querySelectorAll("button")]
          .find((b) => b.textContent?.trim() === close)
          ?.click();
      await settle();
      expect(q('[data-thread-edit-box="b"]')).toBeNull();
      expect(document.activeElement).toBe(editOf());
    }
    done();
  });

  it("closes a reply on Esc and puts focus back on its Reply button", async () => {
    const { q, press, done } = render();
    q('[data-thread-reply="a"]')?.click();
    await settle();
    expect(document.activeElement?.getAttribute("aria-label")).toBe(
      DEFAULT_THREAD_LABELS.replyPlaceholder,
    );
    press("Escape");
    await settle();
    expect(document.activeElement).toBe(q('[data-thread-reply="a"]'));
    expect(document.activeElement?.textContent?.trim()).toBe(reply);
    done();
  });

  it("moves focus to the next comment after a delete, then the one before", async () => {
    const { q, done } = render();
    q(`[data-comment="b"] [aria-label="${DEFAULT_THREAD_LABELS.delete}"]`)?.click();
    await settle();
    expect(document.activeElement).toBe(q('[data-comment="c"]'));
    q(`[data-comment="c"] [aria-label="${DEFAULT_THREAD_LABELS.delete}"]`)?.click();
    await settle();
    expect(document.activeElement).toBe(q('[data-comment="a"]'));
    done();
  });
});

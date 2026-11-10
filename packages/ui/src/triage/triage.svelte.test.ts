import { createRawSnippet, flushSync, mount, tick, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import TriagePlan from "#src/triage/triage-plan.svelte";
import TriageQueue from "#src/triage/triage-queue.svelte";

type Mail = { id: string; subject: string };

const row = createRawSnippet((mail: () => Mail) => ({
  render: () =>
    `<article tabindex="-1" data-mail="${mail().id}"><button>Approve</button></article>`,
}));

function mountIn<P extends Record<string, unknown>>(component: never, props: P) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(component, { target, props });
  flushSync();
  return {
    target,
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

describe("TriageQueue focus", () => {
  function renderQueue() {
    const props = $state({
      items: [
        { id: "m1", subject: "One" },
        { id: "m2", subject: "Two" },
      ] as Mail[],
      key: (m: Mail) => m.id,
      row,
      empty: "Nothing waiting.",
    });
    return { props, ...mountIn(TriageQueue as never, props) };
  }

  it("moves focus to the card now in the place of one that left", async () => {
    const { props, target, done } = renderQueue();
    target.querySelector<HTMLElement>('[data-mail="m1"] button')?.focus();
    props.items = props.items.slice(1);
    await settle();
    expect(document.activeElement).toBe(target.querySelector('[data-mail="m2"]'));
    done();
  });

  it("moves focus to the empty state when the last card leaves", async () => {
    const { props, target, done } = renderQueue();
    target.querySelector<HTMLElement>('[data-mail="m2"] button')?.focus();
    props.items = props.items.slice(0, 1);
    await settle();
    expect(document.activeElement).toBe(target.querySelector('[data-mail="m1"]'));
    target.querySelector<HTMLElement>('[data-mail="m1"]')?.focus();
    props.items = [];
    await settle();
    expect(document.activeElement?.textContent).toContain("Nothing waiting.");
    done();
  });
});

describe("TriagePlan focus", () => {
  function renderPlan() {
    return mountIn(TriagePlan as never, {
      sender: "Ada",
      subject: "Invoice",
      plan: "File it",
      onApprove: () => {},
      onPick: () => {},
      onDismiss: () => {},
    });
  }

  const button = (target: HTMLElement, text: string) =>
    [...target.querySelectorAll("button")].find((b) => b.textContent?.trim() === text);

  it("keeps a busy button focusable and runs it once", async () => {
    let calls = 0;
    let finish = () => {};
    const { target, done } = mountIn(TriagePlan as never, {
      sender: "Ada",
      subject: "Invoice",
      plan: "File it",
      onApprove: () => {
        calls++;
        return new Promise<void>((resolve) => (finish = resolve));
      },
      onPick: () => {},
      onDismiss: () => {},
    });
    const approve = button(target, "Approve");
    approve?.focus();
    approve?.click();
    await settle();
    approve?.click();
    expect(calls).toBe(1);
    expect(approve?.disabled).toBe(false);
    expect(approve?.getAttribute("aria-disabled")).toBe("true");
    expect(document.activeElement).toBe(approve);
    finish();
    done();
  });

  it("puts focus in the task field on Pick, and back on Pick after Cancel or Esc", async () => {
    const { target, done } = renderPlan();
    button(target, "Pick another task")?.click();
    await settle();
    expect(document.activeElement?.tagName).toBe("INPUT");

    button(target, "Cancel")?.click();
    await settle();
    expect(document.activeElement).toBe(button(target, "Pick another task"));

    button(target, "Pick another task")?.click();
    await settle();
    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await settle();
    expect(document.activeElement).toBe(button(target, "Pick another task"));
    done();
  });
});

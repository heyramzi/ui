import { flushSync, mount, unmount } from "svelte";
import { describe, expect, it } from "vite-plus/test";
import ChatGptWindow from "#src/ai/chat-window/ChatGptWindow.svelte";
import ClaudeWindow from "#src/ai/chat-window/ClaudeWindow.svelte";
import { REVEAL_BEATS, revealSchedule } from "#src/ai/chat-window/reveal.svelte.js";
import type { ChatMessage } from "#src/ai/chat-window/types.js";

const messages: ChatMessage[] = [
  { role: "user", text: "How many hours did the team log this week?" },
  { role: "tool", name: "Timesheet", label: "Read week 45" },
  { role: "assistant", text: "The team logged 132 hours." },
];

function render(Component: typeof ChatGptWindow | typeof ClaudeWindow, props: object) {
  const target = document.createElement("div");
  const app = mount(Component, { target, props: { title: "Hours", messages, ...props } });
  flushSync();
  const root = target.firstElementChild as HTMLElement;
  return { root, done: () => void unmount(app) };
}

describe("revealSchedule", () => {
  it("gives each role its beats in order and ends after the last", () => {
    const { beats, end } = revealSchedule(["user", "tool", "assistant"]);
    expect(beats.map((b) => `${b.index}:${b.phase}`)).toEqual([
      "0:done",
      "1:running",
      "1:done",
      "2:thinking",
      "2:streaming",
      "2:done",
    ]);
    expect(beats[0].at).toBe(REVEAL_BEATS.lead);
    expect(end).toBeGreaterThan(beats.at(-1)?.at ?? 0);
    expect(beats.every((b, i) => i === 0 || b.at > beats[i - 1].at)).toBe(true);
  });

  it("is empty for an empty conversation", () => {
    expect(revealSchedule([])).toEqual({ beats: [], end: REVEAL_BEATS.lead });
  });
});

describe.each([
  ["ChatGptWindow", ChatGptWindow, "ChatGPT: Hours", "ChatGPT said:"],
  ["ClaudeWindow", ClaudeWindow, "Claude: Hours", "Claude said:"],
] as const)("%s", (_, Component, label, said) => {
  it("is a labelled figure a reader gets as text, with no focusable part", () => {
    const { root, done } = render(Component, {});
    expect(root.tagName).toBe("FIGURE");
    expect(root.getAttribute("aria-label")).toBe(label);
    const thread = root.querySelector("ol")?.textContent ?? "";
    expect(thread).toContain("You said:");
    expect(thread).toContain(said);
    expect(thread).toContain("The team logged 132 hours.");
    expect(root.querySelectorAll("button, a, input, textarea, [tabindex]")).toHaveLength(0);
    done();
  });

  it("names the connector call with its label, finished when nothing plays", () => {
    const { root, done } = render(Component, {});
    const call = root.querySelector(".call")?.textContent ?? "";
    expect(call).toContain("Used Timesheet");
    expect(call).toContain("Read week 45");
    expect(root.querySelectorAll('[data-phase="done"]')).toHaveLength(3);
    done();
  });

  it("prints a site's own strings and theme", () => {
    const { root, done } = render(Component, {
      theme: "dark",
      placeholder: "Posez votre question",
      labels: { done: "{name} utilisé", userSaid: "Vous avez dit :" },
    });
    expect(root.dataset.mode).toBe("dark");
    expect(root.textContent).toContain("Posez votre question");
    expect(root.querySelector(".call")?.textContent).toContain("Timesheet utilisé");
    expect(root.querySelector("ol")?.textContent).toContain("Vous avez dit :");
    done();
  });
});

import type { Snippet } from "svelte";

/** What the person typed. */
export interface ChatUserMessage {
  role: "user";
  text: string;
}

/** The model's answer: plain text, or a snippet for a table, a figure or a list. */
export interface ChatAssistantMessage {
  role: "assistant";
  text?: string;
  content?: Snippet;
}

/** One call to a connector, drawn as the product draws it. */
export interface ChatToolMessage {
  role: "tool";
  /** The connector or app, as the product names it ("Locameublé"). */
  name: string;
  /** What the call did, short ("Read the 2026 result"). */
  label?: string;
  /** The connector's mark, about 16 to 20px. */
  icon?: Snippet;
  /** Or a URL for it, drawn as a small rounded image. */
  iconSrc?: string;
}

export type ChatMessage = ChatUserMessage | ChatAssistantMessage | ChatToolMessage;

export type ChatRole = ChatMessage["role"];

/** `auto` follows the page: a `.dark` or `data-theme` ancestor, else the system setting. */
export type ChatTheme = "light" | "dark" | "auto";

/** Where one message stands while the reveal plays. */
export type ChatPhase = "hidden" | "thinking" | "streaming" | "running" | "done";

/** Fills `{name}` in a label such as "Used {name}". */
export function fillName(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}

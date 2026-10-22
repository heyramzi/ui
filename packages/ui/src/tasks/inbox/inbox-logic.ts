import type { InboxDraft, InboxItem } from "#src/tasks/inbox/inbox-types.js";

/** The draft to open on: the agent's pick, else the first. */
export function startDraft(drafts: InboxDraft[], recommended?: string): InboxDraft | undefined {
  return drafts.find((draft) => draft.templateId === recommended) ?? drafts[0];
}

/** A person can act on an item only while it waits for them. */
export function isOpen(item: InboxItem): boolean {
  return item.tier === "ask" && item.state === "proposed";
}

export function canUndo(item: InboxItem): boolean {
  return item.tier === "auto" && item.state === "done";
}

/** True when a key press belongs to a text field and so isn't a shortcut. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

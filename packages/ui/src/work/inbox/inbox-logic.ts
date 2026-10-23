import type { InboxDraft, InboxItem } from "#src/work/inbox/inbox-types.js";

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

/** Lowercase, one space between words, no trailing ellipsis: what two copies of a line share. */
function plain(text: string): string {
  return text
    .replace(/(…|\.{3})\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** The lines of a card that say something the title and the command don't. */
export type CardFacts = {
  lines: string[];
  command?: { tool: string; text: string };
};

/**
 * Each fact once: a line that repeats the title or the command, even clipped, is dropped, and
 * one that starts with the title keeps only the rest.
 */
export function cardFacts(item: InboxItem): CardFacts {
  const { command, summary, detail } = item.proposal;
  const shown = [plain(item.title)];
  if (command) shown.push(plain(`${command.tool}: ${command.text}`), plain(command.text));
  const lines: string[] = [];
  for (const raw of [summary, detail]) {
    let line = raw?.trim() ?? "";
    const title = item.title.trim();
    if (line.toLowerCase().startsWith(title.toLowerCase()) && line.length > title.length) {
      line = line.slice(title.length).replace(/^[\s:.,;-]+/, "");
    }
    const key = plain(line);
    if (!key || shown.some((seen) => seen.includes(key) || key.includes(seen))) continue;
    shown.push(key);
    lines.push(line);
  }
  return { lines, command };
}

/** The reasoning of a trace when no line of the card already says it. */
export function freshReasoning(item: InboxItem, facts: CardFacts): string {
  const reasoning = item.trace.reasoning.trim();
  const key = plain(reasoning);
  if (!key) return "";
  const said = [item.title, item.proposal.summary, item.proposal.detail ?? "", ...facts.lines]
    .map(plain)
    .filter(Boolean);
  return said.some((line) => line.includes(key) || key.includes(line)) ? "" : reasoning;
}

const ISO = /^\d{4}-\d{2}-\d{2}T/;
const UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [604_800, "week"],
  [86_400, "day"],
  [3_600, "hour"],
  [60, "minute"],
];

/**
 * A time as a person says it: "3 hr. ago", "Oct 12". A host-formatted string stays as written,
 * and a raw ISO string never reaches the screen.
 */
export function whenOf(at: string, now: number = Date.now(), locale = "en-GB"): string {
  if (!ISO.test(at)) return at;
  const time = Date.parse(at);
  if (Number.isNaN(time)) return "";
  const seconds = Math.round((time - now) / 1000);
  const age = Math.abs(seconds);
  if (age >= 4 * 604_800) {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(time);
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  for (const [size, unit] of UNITS) {
    if (age >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
}

/** True when a key press belongs to a text field and so isn't a shortcut. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
}

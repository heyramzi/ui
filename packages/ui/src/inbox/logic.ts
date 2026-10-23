import { isOpen, isTyping } from "#src/work/inbox/inbox-logic.js";
import {
  ALL,
  DEFAULT_INBOX_LABELS,
  type InboxEntry,
  type InboxActor,
  type InboxEntryKind,
  type InboxFilter,
  type InboxKey,
  type InboxLabels,
  type InboxSubject,
  type InboxThread,
} from "#src/inbox/types.js";

/** A timestamp as a number, with NaN for one that doesn't parse. */
function ms(at: string): number {
  return Date.parse(at);
}

function latestOf(thread: InboxThread): number {
  const time = ms(thread.latestAt);
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time;
}

export type ThreadsOptions = {
  /** Threads with unread entries come before read ones. */
  unreadFirst?: boolean;
};

/** True while a proposal entry still waits for a verdict. */
export function isPending(entry: InboxEntry): boolean {
  return entry.kind === "proposal" && !!entry.proposal && isOpen(entry.proposal);
}

/**
 * One thread per subject, newest first. An entry with no subject id is dropped, and a malformed
 * timestamp sorts last.
 */
export function threadsOf(entries: InboxEntry[], options: ThreadsOptions = {}): InboxThread[] {
  type Row = { entry: InboxEntry; subject: InboxSubject; index: number; time: number };
  const groups = new Map<string, Row[]>();
  entries.forEach((entry, index) => {
    const subject = entry.subject;
    if (!subject?.id) return;
    const key = `${subject.type}:${subject.id}`;
    groups.set(key, [...(groups.get(key) ?? []), { entry, subject, index, time: ms(entry.at) }]);
  });

  const threads: InboxThread[] = [];
  for (const [key, rows] of groups) {
    const ordered = rows.toSorted((a, b) => {
      const aBad = Number.isNaN(a.time);
      const bBad = Number.isNaN(b.time);
      if (aBad !== bBad) return aBad ? 1 : -1;
      return (aBad ? 0 : a.time - b.time) || a.index - b.index;
    });
    const newest = ordered.findLast((row) => !Number.isNaN(row.time)) ?? ordered[0];
    const list = ordered.map((row) => row.entry);
    threads.push({
      key,
      // The newest entry carries the freshest title and status.
      subject: newest.subject,
      entries: list,
      unread: list.filter((entry) => !entry.read).length,
      latestAt: newest.entry.at,
      pending: list.filter(isPending).toReversed(),
    });
  }

  return threads
    .map((thread, index) => ({ thread, index }))
    .toSorted((a, b) => {
      if (options.unreadFirst) {
        const unread = Number(b.thread.unread > 0) - Number(a.thread.unread > 0);
        if (unread) return unread;
      }
      const aTime = latestOf(a.thread);
      const bTime = latestOf(b.thread);
      if (aTime === bTime) return a.index - b.index;
      return bTime - aTime;
    })
    .map((row) => row.thread);
}

export const NO_FILTER: InboxFilter = { type: ALL, who: ALL, needsYou: false };

/** Keep a thread when it matches the type, holds an entry from the person or agent, and has a pending proposal if asked. */
export function filterThreads(threads: InboxThread[], filter: InboxFilter): InboxThread[] {
  return threads.filter(
    (thread) =>
      (filter.type === ALL || thread.subject.type === filter.type) &&
      (filter.who === ALL || thread.entries.some((entry) => entry.actor.name === filter.who)) &&
      (!filter.needsYou || thread.pending.length > 0),
  );
}

export function subjectTypes(threads: InboxThread[]): string[] {
  return [...new Set(threads.map((thread) => thread.subject.type))];
}

export function actorNames(threads: InboxThread[]): string[] {
  return [
    ...new Set(threads.flatMap((thread) => thread.entries.map((entry) => entry.actor.name))),
  ].filter(Boolean);
}

type KeyEventLike = Pick<
  KeyboardEvent,
  "key" | "metaKey" | "ctrlKey" | "altKey" | "defaultPrevented" | "target"
> & { shiftKey?: boolean; code?: string };

const KEYS: Record<string, InboxKey> = {
  j: "next",
  k: "previous",
  u: "toggleRead",
  h: "snooze",
  a: "approve",
  d: "decline",
  s: "steer",
  S: "unfollow",
  e: "edit",
};

/**
 * What a key press asks for, or null when it isn't ours: focus is in a text field, or a modifier
 * other than Linear's Shift+S, Shift+Backspace and Alt+U is held.
 */
export function inboxKeyOf(event: KeyEventLike): InboxKey | null {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey) return null;
  if (isTyping(event.target)) return null;
  // Option+U on a Mac types a dead key, so the physical key decides.
  if (event.altKey) return event.code === "KeyU" && !event.shiftKey ? "readAll" : null;
  if (event.key === "Backspace") return event.shiftKey ? "clearRead" : "clear";
  return KEYS[event.key] ?? null;
}

export type SnoozeChoice = { id: "later" | "tomorrow" | "nextWeek"; until: Date };

/** The three times a snooze offers: 3 hours on, tomorrow at 9, next Monday at 9. */
export function snoozeChoices(now: Date): SnoozeChoice[] {
  const later = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + ((8 - nextWeek.getDay()) % 7 || 7));
  nextWeek.setHours(9, 0, 0, 0);
  return [
    { id: "later", until: later },
    { id: "tomorrow", until: tomorrow },
    { id: "nextWeek", until: nextWeek },
  ];
}

export function resolveInboxLabels(overrides?: Partial<InboxLabels>): InboxLabels {
  return { ...DEFAULT_INBOX_LABELS, ...overrides };
}

/** One line for an entry, in the host's words. `{from}`, `{to}` and `{assignee}` are filled. */
export function entryLine(entry: InboxEntry, labels: InboxLabels): string {
  const fill = (text: string) =>
    text
      .replaceAll("{from}", entry.status?.from ?? "")
      .replaceAll("{to}", entry.status?.to ?? "")
      .replaceAll("{assignee}", entry.assignee ?? "");
  switch (entry.kind) {
    case "status":
      return fill(entry.status?.from ? labels.statusMoved : labels.statusSet);
    case "assigned":
      return fill(labels.assigned);
    case "mention":
      return labels.mentioned;
    case "agent_response":
      return labels.responded;
    case "proposal":
      return labels.proposed;
    default:
      return labels.commented;
  }
}

/** An entry as a sentence: who, then what. With no known actor it starts with the verb, capitalised. */
export function sentenceOf(entry: InboxEntry, labels: InboxLabels): string {
  const line = entryLine(entry, labels);
  if (entry.actor.name) return `${entry.actor.name} ${line}`;
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** What happened to the subject, as against something a person wrote. */
const EVENT_KINDS: ReadonlySet<InboxEntryKind> = new Set(["status", "assigned", "proposal"]);

export function isEvent(entry: InboxEntry): boolean {
  return EVENT_KINDS.has(entry.kind);
}

export type TimelineBlock =
  | { type: "events"; key: string; actor: InboxActor; entries: InboxEntry[] }
  | { type: "message"; key: string; entry: InboxEntry };

/**
 * The thread as blocks: each written message alone, and a run of events by one actor as one
 * quiet group.
 */
export function timelineOf(entries: InboxEntry[]): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];
  for (const entry of entries) {
    if (!isEvent(entry)) {
      blocks.push({ type: "message", key: entry.id, entry });
      continue;
    }
    const last = blocks.at(-1);
    if (
      last?.type === "events" &&
      last.actor.name === entry.actor.name &&
      last.actor.kind === entry.actor.kind
    ) {
      last.entries.push(entry);
    } else {
      blocks.push({ type: "events", key: entry.id, actor: entry.actor, entries: [entry] });
    }
  }
  return blocks;
}

import { describe, expect, it } from "vite-plus/test";
import {
  NO_FILTER,
  entryLine,
  filterThreads,
  inboxKeyOf,
  resolveInboxLabels,
  snoozeChoices,
  threadsOf,
} from "#src/inbox/logic.js";
import type { InboxEntry, InboxSubject } from "#src/inbox/types.js";
import type { InboxItem } from "#src/work/inbox/inbox-types.js";

const tsk7: InboxSubject = { type: "task", id: "7", ref: "TSK-7", title: "Write the pricing page" };
const tsk9: InboxSubject = { type: "task", id: "9", ref: "TSK-9", title: "Fix the footer" };
const doc1: InboxSubject = { type: "doc", id: "1", title: "Brief" };
const ada = { kind: "user", name: "Ada" } as const;
const bot = { kind: "agent", name: "Scribe" } as const;

function entry(id: string, at: string, extra: Partial<InboxEntry> = {}): InboxEntry {
  return { id, kind: "comment", subject: tsk7, actor: ada, at, ...extra };
}

const proposal = (
  state: InboxItem["state"] = "proposed",
  tier: InboxItem["tier"] = "ask",
): InboxItem => ({
  id: "p",
  kind: "decision",
  tier,
  state,
  title: "Send the quote",
  project: { id: "x", name: "X" },
  proposal: { summary: "Send it" },
  confidence: { score: 0.9 },
  trace: { source: { type: "email", label: "Mail", at: "Mon" }, evidence: [], reasoning: "" },
});

describe("threadsOf", () => {
  it("makes one thread of an agent comment and a status change on TSK-7", () => {
    const threads = threadsOf([
      entry("c1", "2026-10-22T09:00:00Z", { kind: "agent_response", actor: bot, body: "Drafted" }),
      entry("s1", "2026-10-22T09:05:00Z", {
        kind: "status",
        status: { from: "todo", to: "review" },
      }),
    ]);
    expect(threads).toHaveLength(1);
    expect(threads[0].entries).toHaveLength(2);
    expect(threads[0].unread).toBe(2);
    expect(threads[0].subject.ref).toBe("TSK-7");
    expect(threads[0].latestAt).toBe("2026-10-22T09:05:00Z");
  });

  it("counts only unread entries", () => {
    const [thread] = threadsOf([
      entry("a", "2026-10-22T09:00:00Z", { read: true }),
      entry("b", "2026-10-22T09:01:00Z"),
    ]);
    expect(thread.unread).toBe(1);
  });

  it("sorts threads by their latest entry, newest first", () => {
    const threads = threadsOf([
      entry("a", "2026-10-22T09:00:00Z"),
      entry("b", "2026-10-22T11:00:00Z", { subject: tsk9 }),
      entry("c", "2026-10-22T10:00:00Z", { subject: doc1 }),
    ]);
    expect(threads.map((t) => t.subject.id)).toEqual(["9", "1", "7"]);
  });

  it("puts threads with unread entries first on request", () => {
    const entries = [
      entry("a", "2026-10-22T09:00:00Z"),
      entry("b", "2026-10-22T11:00:00Z", { subject: tsk9, read: true }),
    ];
    expect(threadsOf(entries).map((t) => t.subject.id)).toEqual(["9", "7"]);
    expect(threadsOf(entries, { unreadFirst: true }).map((t) => t.subject.id)).toEqual(["7", "9"]);
  });

  it("drops an entry with no subject id", () => {
    const threads = threadsOf([
      entry("a", "2026-10-22T09:00:00Z"),
      entry("b", "2026-10-22T09:01:00Z", { subject: undefined }),
      entry("c", "2026-10-22T09:02:00Z", { subject: { ...tsk9, id: "" } }),
    ]);
    expect(threads).toHaveLength(1);
    expect(threads[0].entries.map((e) => e.id)).toEqual(["a"]);
  });

  it("sorts a malformed timestamp last, among threads and inside one", () => {
    const threads = threadsOf([
      entry("bad", "yesterday", { subject: tsk9 }),
      entry("ok", "2026-10-22T09:00:00Z"),
      entry("late", "2026-10-22T09:30:00Z"),
      entry("junk", "??"),
    ]);
    expect(threads.map((t) => t.subject.id)).toEqual(["7", "9"]);
    expect(threads[0].entries.map((e) => e.id)).toEqual(["ok", "late", "junk"]);
    expect(threads[0].latestAt).toBe("2026-10-22T09:30:00Z");
  });

  it("keeps a pending proposal and ignores a decided one", () => {
    const [open] = threadsOf([
      entry("p", "2026-10-22T09:00:00Z", { kind: "proposal", proposal: proposal() }),
    ]);
    expect(open.pending).toHaveLength(1);
    const [done] = threadsOf([
      entry("p", "2026-10-22T09:00:00Z", { kind: "proposal", proposal: proposal("approved") }),
    ]);
    expect(done.pending).toHaveLength(0);
  });
});

describe("filterThreads", () => {
  const threads = threadsOf([
    entry("a", "2026-10-22T09:00:00Z", { actor: bot }),
    entry("b", "2026-10-22T10:00:00Z", { subject: doc1 }),
    entry("p", "2026-10-22T11:00:00Z", { subject: tsk9, kind: "proposal", proposal: proposal() }),
  ]);

  it("filters by type, by who and by needs you", () => {
    expect(filterThreads(threads, { ...NO_FILTER, type: "doc" }).map((t) => t.subject.id)).toEqual([
      "1",
    ]);
    expect(
      filterThreads(threads, { ...NO_FILTER, who: "Scribe" }).map((t) => t.subject.id),
    ).toEqual(["7"]);
    expect(
      filterThreads(threads, { ...NO_FILTER, needsYou: true }).map((t) => t.subject.id),
    ).toEqual(["9"]);
    expect(filterThreads(threads, NO_FILTER)).toHaveLength(3);
  });
});

const press = (key: string, target: EventTarget | null = document.body) =>
  inboxKeyOf({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    defaultPrevented: false,
    target,
  });

describe("keys", () => {
  it("maps the nine keys", () => {
    expect(["j", "k", "u", "h", "a", "d", "s", "e"].map((k) => press(k))).toEqual([
      "next",
      "previous",
      "toggleRead",
      "snooze",
      "approve",
      "decline",
      "steer",
      "edit",
    ]);
    expect(press("x")).toBeNull();
  });

  it("does nothing for u while typing", () => {
    for (const tag of ["input", "textarea", "select"]) {
      expect(press("u", document.createElement(tag))).toBeNull();
    }
    const editable = document.createElement("div");
    Object.defineProperty(editable, "isContentEditable", { value: true });
    expect(press("u", editable)).toBeNull();
  });

  it("ignores a held modifier", () => {
    expect(
      inboxKeyOf({
        key: "u",
        metaKey: true,
        ctrlKey: false,
        altKey: false,
        defaultPrevented: false,
        target: document.body,
      }),
    ).toBeNull();
  });
});

describe("snoozeChoices", () => {
  it("offers 3 hours on, tomorrow at 9 and the next Monday at 9", () => {
    const wed = new Date(2026, 9, 21, 14, 30);
    const [later, tomorrow, nextWeek] = snoozeChoices(wed);
    expect(later.until.getTime() - wed.getTime()).toBe(3 * 60 * 60 * 1000);
    expect([tomorrow.until.getDate(), tomorrow.until.getHours()]).toEqual([22, 9]);
    expect([nextWeek.until.getDay(), nextWeek.until.getDate(), nextWeek.until.getHours()]).toEqual([
      1, 26, 9,
    ]);
  });

  it("moves a Monday to the following Monday", () => {
    const mon = new Date(2026, 9, 26, 10, 0);
    expect(snoozeChoices(mon)[2].until.getDate()).toBe(2);
  });
});

describe("entryLine", () => {
  it("fills the host's own words, French included", () => {
    const fr = resolveInboxLabels({ statusMoved: "a déplacé ceci de {from} à {to}" });
    expect(
      entryLine(
        entry("s", "2026-10-22T09:00:00Z", {
          kind: "status",
          status: { from: "A faire", to: "Revue" },
        }),
        fr,
      ),
    ).toBe("a déplacé ceci de A faire à Revue");
  });
});

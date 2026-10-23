import { describe, expect, it } from "vite-plus/test";
import { NOTE_VERBS } from "#src/core/notes.js";
import type { Note, NoteStatus } from "#src/core/types.js";
import { addNote, applyNoteAct, applyReply, nextId, replyTo } from "#src/server/notes.js";

const note = (id: string, status: NoteStatus, extra: Partial<Note> = {}): Note => ({
  id,
  target: { kind: "video" },
  text: "t",
  status,
  by: "person",
  createdAt: "2026-09-29T00:00:00.000Z",
  ...extra,
});

describe("notes verbs", () => {
  it("numbers the next id past the highest", () => {
    expect(nextId([])).toBe("n1");
    expect(nextId([note("n2", "open"), note("n9", "open"), note("x", "open")])).toBe("n10");
  });
  it("adds an open note and refuses empty words", () => {
    const added = addNote([], { target: { kind: "video" }, text: " hi " });
    expect(added.ok && added.note?.status).toBe("open");
    expect(added.ok && added.note?.text).toBe("hi");
    expect(addNote([], { target: { kind: "video" }, text: " " }).ok).toBe(false);
  });
  it("allows each verb only from its legal statuses", () => {
    const statuses: NoteStatus[] = [
      "open",
      "queued",
      "working",
      "answered",
      "done",
      "proposal",
      "dismissed",
    ];
    for (const verb of Object.values(NOTE_VERBS)) {
      for (const status of statuses) {
        const result = applyNoteAct([note("n1", status)], "n1", verb.act);
        expect(result.ok, `${verb.act} from ${status}`).toBe(verb.from.includes(status));
      }
    }
  });
  it("moves a note where the table says", () => {
    const go = (from: NoteStatus, act: Parameters<typeof applyNoteAct>[2]) => {
      const result = applyNoteAct([note("n1", from, { by: "agent" })], "n1", act);
      return result.ok ? result.notes[0] : undefined;
    };
    expect(go("proposal", "accept")).toMatchObject({ status: "open", by: "person" });
    expect(go("proposal", "dismiss")?.status).toBe("dismissed");
    expect(go("answered", "tick")?.status).toBe("done");
    expect(go("dismissed", "reopen")).toMatchObject({ status: "open", by: "person" });
    const removed = applyNoteAct([note("n1", "open")], "n1", "remove");
    expect(removed.ok && removed.notes).toEqual([]);
  });
  it("a proposal takes a comment and becomes a person-owned open note", () => {
    const result = applyReply([note("n1", "proposal", { by: "agent" })], "n1", "Claude");
    expect(result.ok && result.notes[0]).toMatchObject({
      status: "open",
      by: "person",
      thread: [{ by: "person", text: "Claude" }],
    });
    expect(applyReply([note("n1", "proposal")], "n1", " ").ok).toBe(false);
  });
  it("reply moves the old answer into the thread and reopens", () => {
    const next = replyTo(
      note("n1", "answered", { reply: "Done it", by: "agent", working: { text: "x", at: "" } }),
      " not quite ",
    );
    expect(next).toMatchObject({
      status: "open",
      by: "person",
      reply: undefined,
      working: undefined,
    });
    expect(next.thread).toEqual([
      { by: "agent", text: "Done it" },
      { by: "person", text: "not quite" },
    ]);
    expect(applyReply([note("n1", "open")], "n1", "x").ok).toBe(false);
  });
});

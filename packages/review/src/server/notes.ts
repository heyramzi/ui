/**
 * The shared note verbs. Plain and pure, so the adapters, the HTTP handler and the page's
 * optimistic reducer all run the same transitions and no tool rewrites them.
 */
import { NOTE_VERBS } from "#src/core/notes.js";
import type { Note, NoteAct, NoteTarget } from "#src/core/types.js";

export type NotesResult = { ok: true; notes: Note[] } | { ok: false; error: string };

const fail = (error: string): NotesResult => ({ ok: false, error });

/** n1, n2, n3: short enough to say out loud. */
export function nextId(notes: readonly Pick<Note, "id">[]): string {
  const highest = notes.reduce((max, note) => {
    const n = Number(note.id.replace(/^n/, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `n${highest + 1}`;
}

export type NoteInput = { target: NoteTarget; text: string };
export type NoteExtras = {
  pass?: string;
  by?: Note["by"];
  now?: Date;
  id?: string;
  chat?: boolean;
  reply?: string;
};

/** A new note at the end of the list. */
export function addNote(
  notes: readonly Note[],
  input: NoteInput,
  extras: NoteExtras = {},
): NotesResult & { note?: Note } {
  const text = input.text.trim();
  if (!text) return fail("Write something first.");
  const note: Note = {
    id: extras.id ?? nextId(notes),
    target: input.target,
    text,
    status: extras.reply ? "answered" : "open",
    by: extras.by ?? "person",
    ...(extras.pass ? { pass: extras.pass } : {}),
    ...(extras.chat ? { chat: true } : {}),
    ...(extras.reply ? { reply: extras.reply } : {}),
    createdAt: (extras.now ?? new Date()).toISOString(),
  };
  return { ok: true, notes: [...notes, note], note };
}

/** Run one verb on one note, only from a status where it's legal. */
export function applyNoteAct(notes: readonly Note[], id: string, act: NoteAct): NotesResult {
  const note = notes.find((item) => item.id === id);
  if (!note) return fail("That note is gone.");
  const verb = NOTE_VERBS[act];
  if (!verb.from.includes(note.status)) return fail("That note can't be changed now.");
  if (verb.to === null) return { ok: true, notes: notes.filter((item) => item.id !== id) };
  const to = verb.to;
  const next: Note = {
    ...note,
    status: to,
    // WHY: accepting a proposal or reopening a dismissed one makes it the person's own.
    ...(act === "accept" || (act === "reopen" && note.status === "dismissed")
      ? { by: "person" as const }
      : {}),
    working: undefined,
  };
  return { ok: true, notes: notes.map((item) => (item.id === id ? next : item)) };
}

/** Not happy with the answer: it joins the thread with the reply, and the note goes back to open. */
export function replyTo(note: Note, text: string): Note {
  const thread = [
    ...(note.thread ?? []),
    ...(note.reply ? [{ by: "agent" as const, text: note.reply }] : []),
    { by: "person" as const, text: text.trim() },
  ];
  return { ...note, thread, status: "open", by: "person", reply: undefined, working: undefined };
}

export function applyReply(notes: readonly Note[], id: string, text: string): NotesResult {
  const note = notes.find((item) => item.id === id);
  if (!note) return fail("That note is gone.");
  if (!text.trim()) return fail("Write a reply first.");
  if (note.status !== "answered" && note.status !== "done" && note.status !== "proposal")
    return fail("You can only reply to a suggestion or an answer.");
  return { ok: true, notes: notes.map((item) => (item.id === id ? replyTo(item, text) : item)) };
}

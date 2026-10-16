import { isOpenBeat } from "#src/core/beats.js";
import { addNote, applyNoteAct, applyReply } from "#src/server/notes.js";
import type { Pass, ReviewAction, ReviewModel } from "#src/core/types.js";

/** The pass that owns a beat kind, or the music pass for a music action. */
function bump(passes: Pass[], match: (pass: Pass) => boolean, delta: number): Pass[] {
  if (delta === 0) return passes;
  return passes.map((pass) =>
    match(pass) && pass.open !== undefined
      ? { ...pass, open: Math.max(0, pass.open + delta) }
      : pass,
  );
}

/**
 * What the page shows before the server answers. Pure, so a failed action is undone by refolding.
 */
export function applyOptimistic(
  model: ReviewModel,
  action: ReviewAction,
  tempId = "tmp-0",
  now = new Date(),
): ReviewModel {
  switch (action.type) {
    case "decide": {
      const beat = model.beats.find((item) => item.id === action.beat);
      if (!beat) return model;
      const next = { ...beat, state: action.state, pick: action.pick ?? beat.pick };
      const delta = Number(isOpenBeat(next)) - Number(isOpenBeat(beat));
      return {
        ...model,
        beats: model.beats.map((item) => (item.id === beat.id ? next : item)),
        passes: bump(model.passes, (pass) => pass.kinds?.includes(beat.kind) ?? false, delta),
      };
    }
    case "music": {
      if (!model.music) return model;
      const wasOpen = model.music.decision === "undecided";
      const music =
        "keep" in action
          ? { ...model.music, decision: "kept" as const, keep: action.keep }
          : "skip" in action
            ? { ...model.music, decision: "skipped" as const, keep: undefined }
            : { ...model.music, more: true };
      const delta = Number(music.decision === "undecided") - Number(wasOpen);
      return {
        ...model,
        music,
        passes: bump(model.passes, (pass) => pass.view === "music", delta),
      };
    }
    case "note": {
      const result = addNote(model.notes, action, { id: tempId, now });
      return result.ok ? { ...model, notes: result.notes } : model;
    }
    case "note.act": {
      const result = applyNoteAct(model.notes, action.note, action.act);
      return result.ok ? { ...model, notes: result.notes } : model;
    }
    case "note.reply": {
      const result = applyReply(model.notes, action.note, action.text);
      return result.ok ? { ...model, notes: result.notes } : model;
    }
    case "speech":
      // WHY: the words land in edit.json and the transcript is rebuilt from them, so the gap stays until the server's model says it's filled.
      return model;
    case "refresh":
      return model;
  }
}

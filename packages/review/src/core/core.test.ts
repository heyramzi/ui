import { describe, expect, it } from "vitest";
import { ICONS, spriteMarkup } from "#src/ui/sprite.js";
import { applyOptimistic } from "#src/core/optimistic.js";
import { effectiveState, passMeta, splitRail } from "#src/core/passes.js";
import { ago, clock, clockToSeconds } from "#src/core/format.js";
import type { Beat, Pass, ReviewModel } from "#src/core/types.js";

const beat = (id: string, kind: string, state: Beat["state"]): Beat => ({
  id,
  kind,
  seconds: 1,
  at: "0:01",
  line: "l",
  options: [],
  state,
});
const pass = (id: string, extra: Partial<Pass> = {}): Pass => ({
  id,
  label: id,
  group: "g",
  state: "review",
  view: "beats",
  ...extra,
});
const model: ReviewModel = {
  id: "m",
  title: "t",
  route: "r",
  status: { tone: "neutral", text: "" },
  groups: [{ id: "g", label: "G" }],
  passes: [
    pass("motion", { kinds: ["motion"], open: 2 }),
    pass("music", { view: "music", open: 1 }),
  ],
  kinds: [],
  paragraphs: [],
  beats: [beat("a", "motion", "proposed"), beat("b", "motion", "proposed")],
  music: { decision: "undecided", more: false, options: [] },
  notes: [],
  session: "idle",
};

describe("passes", () => {
  it("counts a pass as done only when nothing is open", () => {
    expect(effectiveState(pass("x", { state: "started", open: 0 }))).toBe("done");
    expect(effectiveState(pass("x", { state: "done", open: 3 }))).toBe("review");
    expect(passMeta(pass("x", { open: 3 }))).toBe("3 left");
    expect(passMeta(pass("x", { state: "started" }))).toBe("Now");
  });
  it("puts passes outside every group in the rail header", () => {
    const rail = splitRail({
      ...model,
      passes: [...model.passes, pass("organise", { group: "prep", view: "none" })],
    });
    expect(rail.header.map((p) => p.id)).toEqual(["organise"]);
    expect(rail.groups[0]?.passes).toHaveLength(2);
  });
});

describe("optimistic", () => {
  it("drops the open count when a beat is decided, and restores it on undo", () => {
    const kept = applyOptimistic(model, {
      type: "decide",
      beat: "a",
      state: "approved",
      pick: "p",
    });
    expect(kept.passes[0]?.open).toBe(1);
    expect(kept.beats[0]).toMatchObject({ state: "approved", pick: "p" });
    const undone = applyOptimistic(kept, { type: "decide", beat: "a", state: "proposed" });
    expect(undone.passes[0]?.open).toBe(2);
  });
  it("counts a changed pick as still open", () => {
    expect(
      applyOptimistic(model, { type: "decide", beat: "a", state: "changed", pick: "z" }).passes[0]
        ?.open,
    ).toBe(2);
  });
  it("settles the music pass when a bed is chosen", () => {
    const next = applyOptimistic(model, { type: "music", keep: "t1" });
    expect(next.music).toMatchObject({ decision: "kept", keep: "t1" });
    expect(next.passes[1]?.open).toBe(0);
  });
  it("adds a temporary note and runs the note verbs", () => {
    const added = applyOptimistic(
      model,
      { type: "note", target: { kind: "video" }, text: "hey" },
      "tmp-1",
    );
    expect(added.notes[0]).toMatchObject({ id: "tmp-1", status: "open" });
    expect(
      applyOptimistic(added, { type: "note.act", note: "tmp-1", act: "remove" }).notes,
    ).toEqual([]);
  });
});

describe("format", () => {
  it("formats clocks and relative time", () => {
    expect(clock(75)).toBe("1:15");
    expect(clock(3725)).toBe("1:02:05");
    expect(clockToSeconds("1:15")).toBe(75);
    const now = Date.parse("2026-09-30T10:00:00Z");
    expect(ago("2026-09-30T09:57:00Z", now)).toBe("3m ago");
  });
});

describe("icons", () => {
  it("draws every icon name into the sprite", () => {
    const markup = spriteMarkup();
    for (const name of Object.keys(ICONS)) expect(markup).toContain(`id="rv-${name}"`);
  });
});

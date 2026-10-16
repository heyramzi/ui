import type { Pass, PassState, ReviewModel } from "#src/core/types.js";

/** A row with a view is a button. A `none` row is a status line. */
export const isClickable = (pass: Pass): boolean => pass.view !== "none";

/** A pass counts as done when nothing in it is open. */
export function effectiveState(pass: Pass): PassState {
  if (pass.state === "done" && pass.open !== undefined && pass.open > 0) return "review";
  if ((pass.state === "started" || pass.state === "review") && pass.open === 0) return "done";
  return pass.state;
}

/** The right-aligned words on a rail row. */
export function passMeta(pass: Pass): string {
  const state = effectiveState(pass);
  if (state === "blocked") return "Paused";
  if (state === "done") return "Done";
  if (pass.open !== undefined && pass.open > 0) return `${pass.open} left`;
  if (state === "started") return "Now";
  if (state === "review") return "To review";
  return "";
}

export const doneCount = (passes: readonly Pass[]): number =>
  passes.filter((p) => effectiveState(p) === "done").length;

/** Passes whose group isn't in the model's groups are status lines for the rail header. */
export function splitRail(model: Pick<ReviewModel, "passes" | "groups">) {
  const known = new Set(model.groups.map((g) => g.id));
  return {
    header: model.passes.filter((pass) => !known.has(pass.group)),
    groups: model.groups
      .map((group) => ({ group, passes: model.passes.filter((pass) => pass.group === group.id) }))
      .filter((entry) => entry.passes.length > 0),
  };
}

export const clickable = (model: Pick<ReviewModel, "passes">): Pass[] =>
  model.passes.filter(isClickable);

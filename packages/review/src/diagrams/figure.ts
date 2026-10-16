import type { LayoutBox } from "#src/core/types.js";

/**
 * A bust in head radii: a round head on a short neck, broad rounded shoulders and a torso that
 * widens to the bottom edge. Head centre at 42% height, grown by the zoom.
 * Every layer, a cut-out included, draws its figure from its own rect: the keyed person in the render
 * stands in the cut-out layer's box, so a taller cut-out puts the head above a shorter camera panel.
 */
export function person(box: LayoutBox) {
	const zoom = box.zoom ?? 1;
	const r = Math.min(box.w * 0.18, box.h * 0.15) * zoom;
	const cx = box.x + box.w / 2;
	const cy = box.y + box.h * (0.42 + (zoom - 1) * 0.2);
	const bottom = box.y + box.h + r;
	// One point, dx and dy in head radii from the head centre, k = -1 for the left side.
	const at = (k: 1 | -1, dx: number, dy: number) => `${cx + k * dx * r} ${cy + dy * r}`;
	const head =
		`M${at(1, 0, -1.1)}` +
		`C${at(1, 0.64, -1.1)} ${at(1, 1.12, -0.62)} ${at(1, 1.12, -0.05)}` +
		`C${at(1, 1.12, 0.52)} ${at(1, 0.72, 1.12)} ${at(1, 0, 1.12)}` +
		`C${at(-1, 0.72, 1.12)} ${at(-1, 1.12, 0.52)} ${at(-1, 1.12, -0.05)}` +
		`C${at(-1, 1.12, -0.62)} ${at(-1, 0.64, -1.1)} ${at(1, 0, -1.1)}Z`;
	const neck = `M${at(-1, 0.5, 0.6)}L${at(-1, 0.56, 1.6)}H${cx + 0.56 * r}L${at(1, 0.5, 0.6)}Z`;
	// Neck base, a gentle slope out to a rounded shoulder, then down and out to the bottom edge.
	const side = (k: 1 | -1) =>
		`C${at(k, 1.1, 1.5)} ${at(k, 1.8, 1.6)} ${at(k, 2.2, 1.95)}` +
		`C${at(k, 2.5, 2.2)} ${at(k, 2.6, 2.6)} ${at(k, 2.65, 3.2)}`;
	const body =
		`M${at(-1, 0.56, 1.45)}${side(-1)}L${cx - 2.85 * r} ${bottom}H${cx + 2.85 * r}` +
		`L${at(1, 2.65, 3.2)}C${at(1, 2.6, 2.6)} ${at(1, 2.5, 2.2)} ${at(1, 2.2, 1.95)}` +
		`C${at(1, 1.8, 1.6)} ${at(1, 1.1, 1.5)} ${at(1, 0.56, 1.45)}Q${at(1, 0, 1.75)} ${at(-1, 0.56, 1.45)}Z`;
	const chin = { cx, cy: cy + r * 1.0, rx: r * 0.5, ry: r * 0.12 };
	return { r, cx, cy, top: cy - 1.1 * r, head, body, neck, chin };
}

<script lang="ts">
	import { useApp } from "#src/hooks/app.svelte.js";

	/** A drag handle on the edge of the rail, the panel or the pass pane beside a tall video. Arrow keys nudge it. */
	let { side }: { side: "rail" | "panel" | "pane" } = $props();
	const app = useApp();
	const p = app.panels;
	const LABEL = { rail: "steps", panel: "notes", pane: "step beside the video" } as const;
	// WHY: the rail and the pane grow when dragged right; the panel sits on the right and grows when dragged left.
	const sign = $derived(side === "panel" ? -1 : 1);
	const width = $derived(side === "rail" ? p.railW : side === "pane" ? p.paneW : p.panelW);
	const set = (px: number) =>
		side === "rail" ? p.resizeRail(px) : side === "pane" ? p.resizePane(px) : p.resizePanel(px);
	const limits = $derived(p.limits[side]);
	let grip = $state<HTMLElement>();

	// WHY: the panel and the pane fit the screen until dragged, so a drag starts from the width on screen, not the stored one.
	function current(): number {
		const box =
			side === "pane" ? grip?.closest(".body")?.querySelector(".pane-scroll") : grip?.parentElement;
		return box ? Math.round(box.getBoundingClientRect().width) : width;
	}

	function down(event: PointerEvent) {
		const start = event.clientX;
		const from = current();
		const target = event.currentTarget as HTMLElement;
		target.setPointerCapture(event.pointerId);
		p.dragging = true;
		const move = (e: PointerEvent) => set(from + sign * (e.clientX - start));
		const up = () => {
			p.dragging = false;
			target.removeEventListener("pointermove", move);
			target.removeEventListener("pointerup", up);
		};
		target.addEventListener("pointermove", move);
		target.addEventListener("pointerup", up);
	}
	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 40 : 12;
		const dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
		if (!dir) return;
		event.preventDefault();
		set(current() + sign * dir * step);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="grip at-{side}"
	role="separator"
	aria-orientation="vertical"
	aria-label="Resize the {LABEL[side]}"
	aria-valuenow={width}
	aria-valuemin={limits.min}
	aria-valuemax={limits.max}
	tabindex="0"
	bind:this={grip}
	onpointerdown={down}
	onkeydown={key}
></div>

<style>
	.grip {
		position: absolute;
		z-index: 20;
		top: 0;
		bottom: 0;
		width: 9px;
		cursor: col-resize;
		touch-action: none;
	}
	.at-rail {
		right: -5px;
	}
	.at-panel {
		left: -5px;
	}
	/* WHY: the pane scrolls, so its grip can't live inside it. It shares the pane's grid cell and sits on its right edge. */
	.at-pane {
		position: relative;
		grid-area: pane;
		justify-self: end;
		margin-right: -5px;
	}
	.grip::after {
		content: "";
		position: absolute;
		inset: 0 4px;
		background: var(--accent);
		opacity: 0;
		transition: opacity var(--duration-quick) var(--ease-smooth-out);
	}
	.grip:hover::after,
	.grip:focus-visible::after {
		opacity: 0.7;
	}
	.grip:focus-visible {
		outline: none;
	}
</style>

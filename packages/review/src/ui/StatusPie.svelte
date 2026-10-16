<script lang="ts" module>
	export type Mark = "all" | "todo" | "needs" | "agents" | "done" | "kept" | "skipped";
</script>

<script lang="ts">
	let { mark, size = 14 }: { mark: Mark; size?: number } = $props();
	// WHY: Linear's geometry. A 1.5 ring at r=6 leaves an inner edge at 5.25; the pie is a circle at
	// r=2 stroked 4 wide, so it fills out to 4 and an even 1.25 of air separates the two.
	const R = 2;
	const C = 2 * Math.PI * R;
	const fill = $derived(mark === "needs" ? 0.25 : mark === "agents" ? 0.5 : 0);
</script>

<svg class="pie m-{mark}" width={size} height={size} viewBox="0 0 14 14" aria-hidden="true">
	{#if mark === "done" || mark === "kept"}
		<circle cx="7" cy="7" r="6.25" class="solid" />
		<use href="#rv-check" x="2.7" y="2.7" width="8.6" height="8.6" class="mark tick" />
	{:else if mark === "skipped"}
		<circle cx="7" cy="7" r="6.25" class="solid" />
		<use href="#rv-x" x="3" y="3" width="8" height="8" class="mark cross" />
	{:else}
		<circle cx="7" cy="7" r="6" class="ring" class:dashed={mark === "all"} />
		<circle
			cx="7"
			cy="7"
			r={R}
			class="slice"
			stroke-dasharray="{C * fill} {C}"
			transform="rotate(-90 7 7)"
		/>
	{/if}
</svg>

<style>
	.pie {
		flex: none;
		display: block;
		fill: none;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.ring {
		stroke: currentColor;
		stroke-width: 1.5;
	}
	/* 12 dashes that close evenly: 2 * PI * 6 = 37.7, cut into 12 periods of 3.14. */
	.dashed {
		stroke-dasharray: 1.4 1.74;
		stroke-linecap: butt;
	}
	.slice {
		stroke: currentColor;
		stroke-width: 4;
		stroke-linecap: butt;
		transition: stroke-dasharray var(--duration-medium) var(--ease-smooth-out);
	}
	.solid {
		fill: currentColor;
		stroke: none;
	}
	/* The sprite's 24 grid is scaled down here, so a 1.5 mark is 1.5 divided by that scale. */
	.mark {
		stroke: var(--ground);
	}
	.tick {
		stroke-width: 4.2;
	}
	.cross {
		stroke-width: 4.5;
	}
	.m-todo,
	.m-needs {
		color: var(--warn-text);
	}
	.m-agents {
		color: var(--accent);
	}
	.m-done,
	.m-kept {
		color: var(--ok);
	}
	.m-skipped,
	.m-all {
		color: var(--faint);
	}
	@media (prefers-reduced-motion: reduce) {
		.slice {
			transition: none;
		}
	}
</style>

<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface ShowcaseVariantProps {
		/** What this variant changes, e.g. "size=line, ocean". */
		label: string;
		children: Snippet;
	}
</script>

<script lang="ts">
	let { label, children }: ShowcaseVariantProps = $props();
</script>

<!-- One cell of a family stage. Four BorderBeams are one component, so they share a stage and a copy control instead of taking four numbered slots, and -->
<!-- they sit side by side because that is how presets are compared. -->
<div class="sc-variant">
	<span class="sc-variant-label">{label}</span>
	<div class="sc-variant-body">
		{@render children()}
	</div>
</div>

<style>
	/*
	 * A family stage is not one ground carrying cells: each variant is a ground of its own, and they stand side by side, one column each, the way the four
	 */

	/*
	 * BorderBeams read before they shared a stage. Global because the ground belongs to the stage, and the rule only exists where a variant renders.
	 */
	:global(.sc-ground:has(> .sc-variant)) {
		display: grid;
		/*
		 * Four across at most, and never a cell under 16rem: five in a row squeezed the gauge card until its caption ran one word per line. Two variants take
		 */

		/*
		 * half the row each, four take a quarter.
		 */
		grid-template-columns: repeat(auto-fit, minmax(max(16rem, calc((100% - 3rem) / 4)), 1fr));
		gap: 1rem;
		padding: 0;
		min-height: 0;
		overflow: visible;
		background: none;
		box-shadow: none;
	}

	/* Below this a row of cells is narrower than the demos standing on them. */
	@media (max-width: 60rem) {
		:global(.sc-ground:has(> .sc-variant)) {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* The cell is the ground: same recess, same dot grid, same hairline. */
	.sc-variant {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		min-width: 0;
		min-height: 10.5rem;
		padding: 1.25rem;
		border-radius: var(--radius-xl, 10px);
		/* A demo wider than its column scrolls in the cell, not past the stage. */
		overflow: auto;
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
		background-color: color-mix(
			in oklab,
			var(--color-muted, var(--muted)) 45%,
			var(--color-background, var(--background))
		);
		background-image: radial-gradient(
			circle at 1px 1px,
			color-mix(in oklab, var(--color-border, var(--border)) 42%, transparent) 1px,
			transparent 0
		);
		background-size: 18px 18px;
		box-shadow: inset 0 0 0 1px
			color-mix(in oklab, var(--color-border, var(--border)) 65%, transparent);
	}

	.sc-variant-label {
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		color: var(--color-muted-foreground, var(--muted-foreground));
		font-family: ui-monospace, SFMono-Regular, monospace;
		overflow-wrap: anywhere;
	}

	.sc-variant-body {
		display: flex;
		flex: 1 1 auto;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		width: 100%;
		min-width: 0;
	}

	/* The cell spans its column; the demo on it stops where a card stops. */
	.sc-variant-body > :global(*) {
		max-width: 42rem;
	}
</style>

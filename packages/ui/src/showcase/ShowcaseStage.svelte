<script lang="ts" module>
	import type { Snippet } from "svelte";

	export interface ShowcaseStageProps {
		/** Component name, e.g. "Dialog". */
		title: string;
		/** One line on what this demo shows. Not a description of the component. */
		note?: string;
		/** Import line for the copy control. Omitted when the demo covers several. */
		importPath?: string;
		/** Give a demo that needs room a taller ground, e.g. a table or a chart. */
		wide?: boolean;
		/** Provenance beside the name, e.g. "shadcn" on a primitive the kit took as is. */
		tag?: string;
		/** Replay control for a demo that animates once. Without it, no button. */
		onaction?: () => void;
		actionLabel?: string;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import ShowcaseImport from "#src/showcase/ShowcaseImport.svelte";
	import "#src/showcase/showcase-shell.css";

	let {
		title,
		note,
		importPath,
		wide = false,
		tag,
		onaction,
		actionLabel = "Replay",
		children,
	}: ShowcaseStageProps = $props();
</script>

<article class={cn("sc-stage", wide && "sc-stage-tall")}>
	<header>
		<div class="sc-stage-name">
			<h3>
				{title}
				{#if tag}
					<span class="sc-tag">{tag}</span>
				{/if}
			</h3>
			{#if note}
				<p>{note}</p>
			{/if}
		</div>

		<!-- The controls sit on the header line rather than under the ground: a footer under every stage put a second full-width row between each demo -->
		<!-- and the next, and the page reads as demos, not as rows of chrome. In a narrow stage they drop to a line of their own, because a nowrap import -->
		<!-- path on the same line left the title nothing to occupy. -->
		<div class="sc-stage-tools">
			{#if onaction}
				<button type="button" class="sc-stage-replay" onclick={onaction}>{actionLabel}</button>
			{/if}
			{#if importPath}
				<ShowcaseImport path={importPath} label={title} />
			{/if}
		</div>
	</header>

	<!-- The ground is a canvas, not a card: it is what makes a white-on-white or
       fully transparent component visible on the surface it sits on. -->
	<div class="sc-ground">
		{@render children()}
	</div>
</article>

<style>
	.sc-stage {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding-block: 1.5rem;
		counter-increment: sc-stage;
	}

	/*
	 * The stage answers its own width, not the viewport's: the same component serves a full-width stack and a four-column kit grid on one page. The header
	 */

	/*
	 * carries the container rather than the stage, because an element with `container-type` cannot also be a subgrid, and the kit grids need the stage
	 */

	/*
	 * to be one so every card in a band shares its tracks. The header is exactly as wide as the stage, so it measures the same thing.
	 */

	/*
	 * One explicit row, and an implicit second that takes the rest. In a wide stage
	 */

	/*
	 * the tools sit in row one, no second track exists and no row gap with it.
	 */
	.sc-stage header {
		container-type: inline-size;
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto;
		grid-auto-rows: 1fr;
		align-items: start;
		gap: 0.5rem 1rem;
		padding-bottom: 0.875rem;
	}

	.sc-stage-name {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
		min-width: 0;
	}

	/*
	 * The number is a counter on the stage, so the page never carries an index it has to keep in step with the demos. `decimal-leading-zero` is what makes a
	 */

	/*
	 * run of these read as a set rather than as a list.
	 */
	h3 {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.3;
		letter-spacing: -0.006em;
		color: var(--color-foreground, var(--foreground));
	}

	h3::before {
		content: counter(sc-stage, decimal-leading-zero);
		font-size: 0.6875rem;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--color-muted-foreground, var(--muted-foreground));
		opacity: 0.65;
	}

	.sc-stage-name p {
		margin: 0;
		max-width: 64ch;
		padding-inline-start: 1.5rem;
		font-size: 0.75rem;
		line-height: 1.5;
		color: var(--color-muted-foreground, var(--muted-foreground));
		text-wrap: pretty;
	}

	/*
	 * The import path is the reason most people open this page, so the control is on screen rather than waiting for a pointer that a touch device never sends.
	 */

	/*
	 * It shrinks and truncates instead of pushing the title out of the header: a nowrap path at flex-shrink 0 measured 435px inside a 310px column and left
	 */

	/*
	 * the title at zero.
	 */
	.sc-stage-tools {
		grid-column: 2;
		grid-row: 1;
		justify-self: end;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
		min-width: 0;
		/*
		 * A length, not a percentage: a percentage max-width resolves to nothing while the auto column is being sized, which collapsed a 900px header's
		 */

		/*
		 * path chip to one word. This still leaves the title two thirds of a full-width header.
		 */
		max-width: 24rem;
	}

	/*
	 * Below this the header cannot hold a title and a path side by side, so the
	 */

	/*
	 * tools take a line of their own and the path gets the full column. 26rem and not 30rem: two equal columns of a 60rem section measure 29.5rem each, and at
	 */

	/*
	 * 30rem every card in the AI and charts grids spent a whole row on a copy control that fits beside the title.
	 */
	@container (max-width: 26rem) {
		.sc-stage-name {
			grid-column: 1 / -1;
		}

		.sc-stage-tools {
			grid-column: 1 / -1;
			grid-row: 2;
			justify-self: stretch;
			justify-content: flex-start;
			max-width: 100%;
			/*
			 * The kit grids stretch the header to a shared track, so sitting the tools at its foot puts every copy control on one line across the band instead
			 */

			/*
			 * of trailing whatever note happens to sit above it.
			 */
			align-self: end;
		}
	}

	.sc-ground {
		flex: 1 1 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		align-content: center;
		justify-content: center;
		gap: 0.75rem;
		/*
		 * Tall enough that a component is not squeezed, short enough that a row of five buttons does not float in an acre of nothing. A demo that needs more
		 */

		/*
		 * asks for it with `wide`.
		 */
		min-height: 10.5rem;
		padding: 2rem 1.75rem;
		border-radius: var(--radius-xl, 10px);
		/* A demo wider than its column scrolls inside the ground rather than bleeding
     past the stage edge. Overlays portal to the body, so none is clipped. */
		overflow: auto;
		/*
		 * WHY the containment is on one axis: `overscroll-behavior: contain` made the ground refuse to chain a wheel in either direction, and a page of these is
		 */

		/*
		 * eighty grounds covering almost every pixel of it. The wheel landed on a ground, the ground had nothing to scroll vertically, and the page did not
		 */

		/*
		 * move. Only the sideways scroll of a wide demo needs containing.
		 */
		overscroll-behavior-x: contain;
		scrollbar-width: thin;
		/*
		 * A ground is recessed, not raised: it is the hole the component sits in. The dot grid is what gives a transparent component something to be seen
		 */

		/*
		 * against, and it is faint enough to disappear under a filled one.
		 */
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

	/*
	 * The ground keeps the full width, because it is the canvas the component is seen against. What stops is the demo standing on it: one stage per row let
	 */

	/*
	 * a card that says `width: 100%` stretch to 2000px and read as a bar. A variant row is the exception, being a stack of demos rather than one.
	 */
	.sc-ground > :global(*:not(.sc-variant)) {
		max-width: 42rem;
	}

	.sc-stage-tall .sc-ground > :global(*:not(.sc-variant)) {
		max-width: 62rem;
	}

	/*
	 * A tall ground is taller, not differently aligned. `justify-content: stretch` here read as `flex-start`, so any demo narrower than the ground sat against
	 */

	/*
	 * its left padding while every other stage on the page centred: the logo row, the list toolbar and the table each left ~380px of empty ground to their
	 */

	/*
	 * right. A demo that really wants the full width says so itself with `width: 100%`, which centring does not take away.
	 */
	.sc-stage-tall .sc-ground {
		align-items: stretch;
		min-height: 19rem;
	}

	.sc-stage-replay {
		padding: 0.25rem 0.625rem;
		border: 1px solid var(--color-border, var(--border));
		border-radius: var(--radius-lg, 8px);
		font-size: 0.6875rem;
		font-weight: 500;
		color: var(--color-muted-foreground, var(--muted-foreground));
		background: var(--color-background, var(--background));
		cursor: pointer;
		transition:
			color var(--duration-quick, 150ms) var(--ease-smooth-out, ease),
			background-color var(--duration-quick, 150ms) var(--ease-smooth-out, ease),
			transform var(--duration-micro, 80ms) var(--ease-smooth-out, ease);
	}

	.sc-stage-replay:hover {
		color: var(--color-foreground, var(--foreground));
		background: color-mix(in oklab, var(--color-muted, var(--muted)) 70%, transparent);
	}

	.sc-stage-replay:active {
		transform: translateY(1px);
	}

	@media (prefers-reduced-motion: reduce) {
		.sc-stage-replay {
			transition: none;
		}

		.sc-stage-replay:active {
			transform: none;
		}
	}
</style>

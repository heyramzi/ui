<!-- ========================== -->
<!-- IMPORTS                    -->
<!-- ========================== -->
<script lang="ts">
	import type { Component } from "svelte";
	import ShowcaseStage from "#src/showcase/ShowcaseStage.svelte";
	import ShowcaseVariant from "#src/showcase/ShowcaseVariant.svelte";
	import Default from "#src/showcase/demos/effects/border-beam-default.svelte";
	import Sunset from "#src/showcase/demos/effects/border-beam-sunset.svelte";
	import Line from "#src/showcase/demos/effects/border-beam-line.svelte";
	import Mono from "#src/showcase/demos/effects/border-beam-mono.svelte";
	import Beam from "#src/showcase/demos/effects/animated-beam.svelte";
	import Hub from "#src/showcase/demos/effects/integrations-hub.svelte";
	import SpotlightDemo from "#src/showcase/demos/effects/spotlight.svelte";
	import MarqueeDemo from "#src/showcase/demos/effects/marquee.svelte";
	import RevealDemo from "#src/showcase/demos/effects/image-reveal.svelte";
	import TextEffectDemo from "#src/showcase/demos/effects/text-effect.svelte";
	import AnimatedGroupDemo from "#src/showcase/demos/effects/animated-group.svelte";
	import InViewDemo from "#src/showcase/demos/effects/in-view.svelte";
	import ProgressiveBlurDemo from "#src/showcase/demos/effects/progressive-blur.svelte";
	import ImageComparisonDemo from "#src/showcase/demos/effects/image-comparison.svelte";
	import MagneticDemo from "#src/showcase/demos/effects/magnetic.svelte";

	// =========================
	// TYPES
	// =========================
	// A family shows its presets stacked in one stage. One component, one number,
	// one copy control, however many variants it ships.
	type Demo = {
		title: string;
		note: string;
		path: string;
		Comp?: Component;
		variants?: { label: string; Comp: Component }[];
	};

	// =========================
	// STATE
	// =========================
	const demos: Demo[] = [
		{
			title: "BorderBeam",
			note: "Animated gradient border, four presets",
			path: "import { BorderBeam } from '@heyramzi/ui';",
			variants: [
				{ label: "default", Comp: Default },
				{ label: "staticColors, duration=6, colorVariant=sunset", Comp: Sunset },
				{ label: "size=line, colorVariant=ocean", Comp: Line },
				{ label: "size=sm, colorVariant=mono", Comp: Mono },
			],
		},
		{
			title: "AnimatedBeam",
			note: "Gradient comet along a path between two anchors",
			path: "import { AnimatedBeam } from '@heyramzi/ui';",
			variants: [
				{ label: "two nodes", Comp: Beam },
				{ label: "many beams fanning into one node", Comp: Hub },
			],
		},
		{
			title: "Spotlight",
			note: "Soft sweeping beam over a dark surface",
			Comp: SpotlightDemo,
			path: "import { Spotlight } from '@heyramzi/ui';",
		},
		{
			title: "Marquee",
			note: "pauseOnHover, masked edges",
			Comp: MarqueeDemo,
			path: "import { Marquee } from '@heyramzi/ui';",
		},
		{
			title: "ImageReveal",
			note: "Pixel-mosaic loader dissolving into a generated image",
			Comp: RevealDemo,
			path: "import { ImageReveal } from '@heyramzi/ui';",
		},
		{
			title: "TextEffect",
			note: "per=char, preset=blur-slide, staggered",
			Comp: TextEffectDemo,
			path: "import { TextEffect } from '@heyramzi/ui';",
		},
		{
			title: "AnimatedGroup",
			note: "Staggered entrance for any children",
			Comp: AnimatedGroupDemo,
			path: "import { AnimatedGroup } from '@heyramzi/ui';",
		},
		{
			title: "InView",
			note: "Replays as the block scrolls back in",
			Comp: InViewDemo,
			path: "import { InView } from '@heyramzi/ui';",
		},
		{
			title: "ProgressiveBlur",
			note: "Masked backdrop-filter ramp, no runtime",
			Comp: ProgressiveBlurDemo,
			path: "import { ProgressiveBlur } from '@heyramzi/ui';",
		},
		{
			title: "ImageComparison",
			note: "Before / after wipe, drag or arrow keys",
			Comp: ImageComparisonDemo,
			path: "import { ImageComparison } from '@heyramzi/ui';",
		},
		{
			title: "Magnetic",
			note: "use:magnetic pulls the button toward the pointer",
			Comp: MagneticDemo,
			path: "import { magnetic } from '@heyramzi/ui';",
		},
	];
</script>

<!-- ========================== -->
<!-- MARKUP                     -->
<!-- ========================== -->
<div class="grid">
	{#each demos as d (d.title)}
		<ShowcaseStage title={d.title} note={d.note} importPath={d.path}>
			{#if d.variants}
				{#each d.variants as v (v.label)}
					<ShowcaseVariant label={v.label}>
						<div class="card"><v.Comp /></div>
					</ShowcaseVariant>
				{/each}
			{:else if d.Comp}
				<div class="card"><d.Comp /></div>
			{/if}
		</ShowcaseStage>
	{/each}
</div>

<!-- ========================== -->
<!-- STYLE                      -->
<!-- ========================== -->
<style>
	/* One demo per row, the rule ShowcaseSection states for `.sc-stack`. An
	   effect is read by watching it run, and a quarter-width stage clips it. */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
	}
	.card {
		width: 100%;
		min-height: 5rem;
	}
</style>

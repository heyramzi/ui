<script lang="ts">
	import { TypingDots } from "@heyramzi/ui/ai/typing-dots";
	import { TrendPill } from "@heyramzi/ui/charts";
	import { TimeDot } from "@heyramzi/ui/work";
</script>

<svelte:head>
	<title>Layer check | heyramzi/ui</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- Kit CSS sits in Tailwind's components layer, so each class below beats the part's own style.
     site/e2e/layers.e2e.ts reads the computed values. -->
<div class="mx-auto flex max-w-xl flex-col gap-6 px-6 py-12">
	<h1 class="text-2xl font-semibold">Layer check</h1>
	<p class="text-muted-foreground text-sm">
		A utility class on a kit part beats the part's own CSS, so each swatch matches the red control.
		The last dot is a component style block, which stays dark until those are layered too.
	</p>
	<div class="flex flex-wrap items-center gap-6">
		<div data-testid="control" class="size-6 rounded-none bg-red-500"></div>
		<span data-testid="trend-pill-wrap">
			<TrendPill delta={12} class="rounded-none bg-red-500 px-6 text-black" />
		</span>
		<TypingDots data-testid="typing-dots" class="gap-3 bg-red-500" />
		<span data-testid="time-dot-wrap"><TimeDot class="bg-red-500" size={12} /></span>
	</div>
</div>

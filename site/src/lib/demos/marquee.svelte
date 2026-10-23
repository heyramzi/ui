<script lang="ts">
	import Marquee from "@heyramzi/ui/effects/marquee";
	const title = "A line longer than its box scrolls, and a short one stays put";
	const items = [
		"Copy source in",
		"Own the code",
		"Svelte 5 runes",
		"Tailwind v4 tokens",
		"No runtime wrapper",
		"MIT",
	];
</script>

<Marquee
	repeat={4}
	pauseOnHover
	class="w-full max-w-xl rounded-xl border border-border bg-card py-3"
>
	{#each items as item}
		<span class="mx-6 text-sm text-muted-foreground">{item}</span>
	{/each}
</Marquee>

<div class="mt-4 flex flex-col items-center gap-2 text-sm text-foreground">
	<Marquee
		overflowOnly
		speed={30}
		gap="40px"
		fade="16px"
		delay={1000}
		class="max-w-56 whitespace-nowrap"
	>
		{title}
	</Marquee>
	<Marquee overflowOnly class="max-w-56 whitespace-nowrap">Fits, so it stays still</Marquee>
</div>

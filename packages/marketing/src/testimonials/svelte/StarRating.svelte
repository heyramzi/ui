<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import starIcon from "#src/testimonials/svelte/star-icon.svg?raw";

	// =========================
	// PROPS
	// =========================
	let { rating, size }: { rating: number; size?: number } = $props();

	// =========================
	// DERIVED
	// =========================
	const sizeClass = $derived(size ? `size-[${size}px]` : "size-4");
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="flex gap-0.5">
	{#each [1, 2, 3, 4, 5] as i (i)}
		<span
			class="{sizeClass} [&>svg]:size-full {i <= rating
				? 'fill-yellow-400 text-yellow-400'
				: 'fill-gray-200 text-gray-200'}"
			style:width={size ? `${size}px` : undefined}
			style:height={size ? `${size}px` : undefined}
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html starIcon}
		</span>
	{/each}
</div>

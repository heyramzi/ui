<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { initial } from "#src/testimonials/svelte/initial.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		name: string | null | undefined;
		src?: string | null;
		/** The size, and nothing else: `size-9`. */
		class?: string;
		/** The fallback disc's colours and type size. */
		fallbackClass?: string;
	}

	let { name, src, class: className = "size-9", fallbackClass = "" }: Props = $props();

	// =========================
	// STATE
	// =========================
	/** The src that failed, so a later one gets its own chance to load. */
	let broken = $state("");
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- WHY shrink-0: the name beside it truncates, and a flex row shrinks the avatar
     into an oval before it shrinks a column that is allowed to. -->
<!-- =========================== -->
{#if src && broken !== src}
	<img
		{src}
		alt={name ?? ""}
		class="shrink-0 rounded-full object-cover {className}"
		loading="lazy"
		onerror={() => (broken = src)}
	/>
{:else}
	<div
		aria-hidden="true"
		class="flex shrink-0 items-center justify-center rounded-full font-medium {className} {fallbackClass}"
	>
		{initial(name)}
	</div>
{/if}

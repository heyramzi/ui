<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import { FLAG_BASE, flagCode } from "#src/components/flag/codes.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		/** ISO 3166-1 alpha-2 code, or XK for Kosovo, any case. Unknown or empty renders nothing. */
		code: string | null | undefined;
		/** Names the flag for a reader. Leave it out when the country name sits beside it. */
		label?: string;
		/** Where the host serves `<CODE>.svg`. */
		base?: string;
		class?: string;
	}

	let { code, label, base = FLAG_BASE, class: className }: Props = $props();

	// =========================
	// STATE
	// =========================
	let file = $derived(flagCode(code));
	// A file the host doesn't serve hides the flag instead of showing a broken image.
	let failedFor = $state<string | null>(null);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if file && failedFor !== file}
	<img
		src="{base}/{file}.svg"
		alt={label ?? ""}
		aria-hidden={label ? undefined : "true"}
		width="3"
		height="2"
		loading="lazy"
		decoding="async"
		draggable="false"
		onerror={() => (failedFor = file)}
		class={cn(
			"inline-block aspect-[3/2] h-[1em] w-auto max-w-none shrink-0 object-cover align-[-0.125em]",
			"rounded-[min(var(--radius-sm),0.15em)] outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/15",
			className,
		)}
	/>
{/if}

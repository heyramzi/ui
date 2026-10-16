<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "@heyramzi/utils";

	// =========================
	// CONSTANTS
	// =========================
	// The host serves these files from /flags. Pass `flags` for another set or path.
	const DEFAULT_FLAGS: Record<string, string> = {
		en: "/flags/US.svg",
		fr: "/flags/FR.svg",
	};

	// =========================
	// PROPS
	// =========================
	interface Props {
		language: string;
		/** Language code to image URL. */
		flags?: Record<string, string>;
		size?: "sm" | "md";
		showLabel?: boolean;
		class?: string;
	}

	let {
		language,
		flags = DEFAULT_FLAGS,
		size = "sm",
		showLabel = false,
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let src = $derived(flags[language]);
	let sizeClass = $derived(size === "md" ? "size-5" : "size-3.5");
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if src}
	<span class={cn("inline-flex items-center gap-1.5", className)}>
		<img
			{src}
			alt={language.toUpperCase()}
			class={cn("shrink-0 rounded-sm", sizeClass)}
			loading="lazy"
		/>
		{#if showLabel}
			<span class="text-xs font-medium uppercase text-muted-foreground">{language}</span>
		{/if}
	</span>
{:else if showLabel}
	<span class={cn("text-xs font-medium uppercase text-muted-foreground", className)}>{language}</span>
{/if}

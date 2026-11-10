<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import { LANGUAGE_FLAGS } from "#src/components/language-flag/flags.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		language: string;
		/** Language code to image URL, for another set or path. */
		flags?: Record<string, string>;
		size?: "sm" | "md";
		showLabel?: boolean;
		class?: string;
	}

	let {
		language,
		flags = LANGUAGE_FLAGS,
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
<!-- With the label shown, the flag is decorative, or the code is read twice. -->
{#if src}
	<span class={cn("inline-flex items-center gap-1.5", className)}>
		<img
			{src}
			alt={showLabel ? "" : language.toUpperCase()}
			class={cn("shrink-0 rounded-sm", sizeClass)}
			loading="lazy"
		/>
		{#if showLabel}
			<span class="text-xs font-medium uppercase text-muted-foreground">{language}</span>
		{/if}
	</span>
{:else if showLabel}
	<span class={cn("text-xs font-medium uppercase text-muted-foreground", className)}
		>{language}</span
	>
{/if}

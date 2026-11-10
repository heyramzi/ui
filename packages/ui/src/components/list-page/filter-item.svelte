<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { Checkbox } from "#src/shadcn/checkbox/index.js";
	import { Check } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		checked: boolean;
		onclick: () => void;
		variant?: "checkbox" | "radio";
		children: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let { checked, onclick, variant = "checkbox", children }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<button
	type="button"
	class="flex min-h-8 items-center gap-2 rounded-lg px-2 text-sm transition-colors duration-quick ease-smooth-out hover:bg-foreground/6 motion-reduce:transition-none any-pointer-coarse:min-h-11"
	{onclick}
>
	{#if variant === "radio"}
		<span
			class={cn(
				"grid size-3.5 shrink-0 place-items-center rounded-full border transition-colors duration-quick ease-smooth-out motion-reduce:transition-none",
				checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
			)}
		>
			{#if checked}
				<Check aria-hidden="true" class="size-2.5" weight="bold" />
			{/if}
		</span>
	{:else}
		<Checkbox {checked} />
	{/if}
	{@render children()}
</button>

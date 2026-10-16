<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { Checkbox } from "#src/shadcn/checkbox/index.js";
import { Check } from "phosphor-svelte";
import { cn } from "@heyramzi/utils";

// =========================
// TYPES
// =========================
type Props = {
	checked: boolean;
	onclick: () => void;
	variant?: "checkbox" | "radio";
	children: Snippet;
};

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
	class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted"
	{onclick}
>
	{#if variant === "radio"}
		<span
			class={cn(
				"grid size-3.5 shrink-0 place-items-center rounded-full border transition-colors",
				checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
			)}
		>
			{#if checked}
				<Check class="size-2.5" weight="bold" />
			{/if}
		</span>
	{:else}
		<Checkbox {checked} />
	{/if}
	{@render children()}
</button>

<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { cn } from "@heyramzi/utils";
import type { PhosphorIcon } from "@heyramzi/ui/lib/icon-types.js";

// =========================
// TYPES
// =========================
interface Props {
	// Not list-page's `EmptyState`: that one takes exactly one action, and a
	// dashboard can be empty for reasons (nothing connected, nothing synced)
	// that need two buttons.

	// The dashed edge marks truly empty, not loading.
	icon?: PhosphorIcon;
	title: string;
	description?: string;
	/** One or two buttons. Omit where there is nothing the reader can do. */
	actions?: Snippet;
	class?: string;
};

// =========================
// PROPS
// =========================
let { icon: Icon, title, description, actions, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class={cn(
		"rounded-xl border-2 border-dashed border-border bg-transparent p-10 text-center",
		className,
	)}
>
	<div class="mx-auto flex max-w-md flex-col items-center gap-4">
		{#if Icon}
			<Icon class="size-10 text-muted-foreground" aria-hidden="true" />
		{/if}
		<div class="space-y-1.5">
			<h2 class="font-heading text-lg font-semibold">{title}</h2>
			{#if description}
				<p class="text-sm text-muted-foreground">{description}</p>
			{/if}
		</div>
		{#if actions}
			<div class="flex flex-wrap justify-center gap-2">{@render actions()}</div>
		{/if}
	</div>
</div>

<script lang="ts" module>
	import type { ButtonProps } from "#src/shadcn/button/index.js";

	export type AiStatus = "idle" | "processing" | "done";

	export interface AiButtonProps {
		status?: AiStatus;
		label?: string;
		processingLabel?: string;
		variant?: ButtonProps["variant"];
		size?: ButtonProps["size"];
		disabled?: boolean;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		iconOnly?: boolean;
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import { Sparkle } from "phosphor-svelte";
	import { Spinner } from "#src/shadcn/spinner/index.js";
	import { Button } from "#src/shadcn/button/index.js";

	// =========================
	// PROPS
	// =========================
	let {
		status = "idle",
		label = "Generate",
		processingLabel = "Processing...",
		variant = "outline",
		size = "sm",
		disabled = false,
		onclick,
		class: className,
		iconOnly = false,
	}: AiButtonProps = $props();

	// A disabled button drops focus to the page, so while it works it's aria-disabled and ignores presses instead.
	const busy = $derived(status === "processing");

	function handleClick(e: MouseEvent) {
		if (busy) return;
		onclick?.(e);
	}
</script>

<!-- ===========================
     MARKUP
     =========================== -->
{#if iconOnly}
	<Button
		{variant}
		size="sm"
		icon
		{disabled}
		aria-disabled={busy || undefined}
		aria-label={busy ? processingLabel : label}
		onclick={handleClick}
		class={cn("relative", busy && "pointer-events-none opacity-50", className)}
	>
		{#if busy}
			<Spinner class="size-4" />
		{:else}
			<Sparkle class="size-4" weight="fill" aria-hidden="true" />
		{/if}
	</Button>
{:else}
	<Button
		{variant}
		{size}
		{disabled}
		aria-disabled={busy || undefined}
		onclick={handleClick}
		class={cn("gap-1.5", busy && "pointer-events-none opacity-50", className)}
	>
		{#if busy}
			<Spinner class="size-3.5" />
			<span>{processingLabel}</span>
		{:else}
			<Sparkle class="size-3.5" weight="fill" aria-hidden="true" />
			<span>{label}</span>
		{/if}
	</Button>
{/if}

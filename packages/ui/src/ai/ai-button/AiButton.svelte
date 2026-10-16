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
	import { cn } from "@heyramzi/utils";
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
</script>

<!-- ===========================
     MARKUP
     =========================== -->
{#if iconOnly}
	<Button
		{variant}
		size="sm"
		icon
		disabled={disabled || status === "processing"}
		onclick={onclick}
		class={cn(
			"relative",
			status === "processing" && "pointer-events-none",
			className,
		)}
	>
		{#if status === "processing"}
			<Spinner class="size-4" />
		{:else}
			<Sparkle class="size-4" weight="fill" />
		{/if}
	</Button>
{:else}
	<Button
		{variant}
		{size}
		disabled={disabled || status === "processing"}
		onclick={onclick}
		class={cn(
			"gap-1.5",
			status === "processing" && "pointer-events-none",
			className,
		)}
	>
		{#if status === "processing"}
			<Spinner class="size-3.5" />
			<span>{processingLabel}</span>
		{:else}
			<Sparkle class="size-3.5" weight="fill" />
			<span>{label}</span>
		{/if}
	</Button>
{/if}

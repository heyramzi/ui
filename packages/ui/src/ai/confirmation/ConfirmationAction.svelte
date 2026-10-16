<script lang="ts" module>
	import type { ButtonProps } from "#src/shadcn/button/index.js";

	export interface ConfirmationActionProps extends ButtonProps {
		busyLabel?: string;
		busyWhen?: "always" | "default" | "never";
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { Button } from "#src/shadcn/button/index.js";
	import { getConfirmationContext } from "#src/ai/confirmation/confirmation-context.svelte.js";

	let {
		class: className,
		variant = "default",
		size = "sm",
		disabled,
		children,
		busyLabel,
		busyWhen = "default",
		...rest
	}: ConfirmationActionProps = $props();

	const ctx = getConfirmationContext();
	// WHY: by default the primary action shows the busy spinner during execute,
	// while the cancel/secondary action stays clickable until disabled. Consumers
	// can override per-button with busyWhen="always"/"never".
	const showBusy = $derived(
		busyWhen === "always"
			? ctx.executing
			: busyWhen === "never"
				? false
				: ctx.executing && variant === "default",
	);
	const isDisabled = $derived(Boolean(disabled) || ctx.executing);
</script>

<Button
	{...rest}
	{variant}
	{size}
	type="button"
	disabled={isDisabled}
	class={cn("h-8 px-3 text-sm", className)}
>
	{#if showBusy && busyLabel}
		{busyLabel}
	{:else}
		{@render children?.()}
	{/if}
</Button>

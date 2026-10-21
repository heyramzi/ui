<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLFormAttributes } from "svelte/elements";

	export interface PromptInputProps extends Omit<HTMLFormAttributes, "onsubmit"> {
		onSubmit?: (value: string, event: SubmitEvent) => void | Promise<void>;
		class?: string;
		/** A line under the input, for a send that failed. Cleared by passing null. */
		error?: string | null;
		/** Colour of the focus ring. Falls back to `--ring`. */
		accent?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import { fade } from "svelte/transition";

	let {
		class: className,
		onSubmit,
		error = null,
		accent,
		children,
		...rest
	}: PromptInputProps = $props();

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!onSubmit) return;
		const form = event.currentTarget as HTMLFormElement;
		const data = new FormData(form);
		const value = (data.get("message") as string | null) ?? "";
		await onSubmit(value, event);
	}
</script>

<form
	class={cn(
		"w-full overflow-hidden rounded-lg border bg-[color:var(--card,white)]",
		"border-[color:var(--border,rgba(0,0,0,0.1))]",
		"focus-within:ring-1 focus-within:ring-[color:var(--ring,currentColor)]",
		className,
	)}
	style:--ring={accent}
	onsubmit={handleSubmit}
	{...rest}
>
	{@render children?.()}
	{#if error}
		<p role="alert" class="text-destructive px-3 pb-2 text-xs" in:fade={{ duration: 150 }}>
			{error}
		</p>
	{/if}
</form>

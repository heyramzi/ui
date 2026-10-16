<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLFormAttributes } from "svelte/elements";

	export interface PromptInputProps extends Omit<HTMLFormAttributes, "onsubmit"> {
		onSubmit?: (value: string, event: SubmitEvent) => void | Promise<void>;
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";

	let { class: className, onSubmit, children, ...rest }: PromptInputProps = $props();

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
	onsubmit={handleSubmit}
	{...rest}
>
	{@render children?.()}
</form>

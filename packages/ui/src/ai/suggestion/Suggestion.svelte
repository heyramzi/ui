<script lang="ts" module>
	import { Button, type ButtonProps } from "#src/shadcn/button/index.js";

	export interface SuggestionProps extends Omit<ButtonProps, "onclick" | "children"> {
		suggestion: string;
		onclick?: (suggestion: string) => void;
		class?: string;
		children?: import("svelte").Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";

	let {
		suggestion,
		onclick,
		class: className,
		variant = "outline",
		size = "sm",
		children,
		...rest
	}: SuggestionProps = $props();

	const handleClick = () => {
		onclick?.(suggestion);
	};
</script>

<Button
	class={cn("cursor-pointer rounded-full px-4 whitespace-nowrap", className)}
	onclick={handleClick}
	{size}
	type="button"
	{variant}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{suggestion}
	{/if}
</Button>

<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export interface ConfirmationTitleProps extends HTMLAttributes<HTMLParagraphElement> {
		class?: string;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";

	let { class: className, children, ...rest }: ConfirmationTitleProps = $props();
</script>

<p
	class={cn("text-2xs font-medium text-[color:var(--muted-foreground,inherit)]", className)}
	{...rest}
>
	{@render children?.()}
</p>

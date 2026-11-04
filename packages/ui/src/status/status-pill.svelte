<script lang="ts" module>
	import type { Tone } from "#src/lib/tone.js";
	import { PILL_TINT } from "#src/status/pill-tint.js";

	export { PILL_TINT };
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "class" | "children"> {
		tone?: Tone;
		/** What sits before the label: a Phosphor icon, a `StatusIcon`, a dot or a spinner. */
		icon?: Snippet;
		children?: Snippet;
		class?: string;
	}

	let { tone = "neutral", icon, children, class: className, ...restProps }: Props = $props();
</script>

<!-- A pill means status or a count (DESIGN.md rule 15), so this is the one rounded-full chip. -->
<span
	data-slot="status-pill"
	data-tone={tone}
	class={cn(
		"inline-flex h-5 max-w-full shrink-0 items-center gap-1 overflow-hidden rounded-full px-2 text-xs font-medium whitespace-nowrap",
		"transition-[background-color,color] duration-quick ease-smooth-out motion-reduce:transition-none",
		"[&>svg]:size-3 [&>svg]:shrink-0",
		icon && "pl-1.5",
		PILL_TINT[tone],
		className,
	)}
	{...restProps}
>
	{@render icon?.()}
	<span class="min-w-0 truncate">{@render children?.()}</span>
</span>

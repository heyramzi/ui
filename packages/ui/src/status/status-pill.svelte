<script lang="ts" module>
	import type { Tone } from "#src/lib/tone.js";

	// A quiet tint and no border: the icon and the text carry the tone, the fill only groups
	// them. Neutral reads off the foreground, not `bg-muted`, because muted sits 0.005 L from
	// the canvas and vanishes there (tokens board, "what fights the new scale").
	export const PILL_TINT: Record<Tone, string> = {
		neutral: "bg-foreground/6 text-muted-foreground",
		accent:
			"bg-[color-mix(in_oklab,var(--tone-accent,var(--color-primary))_12%,transparent)] text-[color:var(--tone-accent,var(--color-primary))]",
		info: "bg-info/12 text-info-800 dark:text-info-400",
		success: "bg-success/12 text-success-800 dark:text-success-400",
		warning: "bg-warning/14 text-warning-800 dark:text-warning-400",
		destructive: "bg-destructive/10 text-destructive-ink",
	};
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

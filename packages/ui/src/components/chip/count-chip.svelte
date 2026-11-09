<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn } from "#src/lib/utils.js";

	interface Props extends Omit<HTMLAttributes<HTMLSpanElement>, "class" | "children"> {
		count: number;
		/** `sm` is 16px, for a count inside a control or on a button; `md` is 20px, beside a heading. */
		size?: "sm" | "md";
		/** `brand` marks a count that is on: an applied filter, the selected segment. */
		tone?: "neutral" | "brand";
		class?: string;
	}

	let { count, size = "md", tone = "neutral", class: className, ...restProps }: Props = $props();

	const SIZE = { sm: "h-4 min-w-4", md: "h-5 min-w-5" };
	const TONE = {
		neutral: "bg-foreground/6 text-muted-foreground",
		brand: "bg-brand/12 text-brand dark:text-brand-light",
	};
</script>

<!-- A count is a pill (DESIGN.md rule 15). Min width equals height with 4px padding, so one digit
     draws a circle, not an ellipse. -->
<span
	class={cn(
		"inline-grid shrink-0 place-items-center rounded-full px-1 text-xs leading-none font-medium tabular-nums",
		SIZE[size],
		TONE[tone],
		className,
	)}
	{...restProps}
>
	{count.toLocaleString()}
</span>

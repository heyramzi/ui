<script lang="ts">
/*
 * One A to E grade on one colour scale, so a C means one thing everywhere.
 * Light mode takes the 800 shades, since amber on cream fails contrast.
 */
import { cn } from "#src/lib/utils.js";

interface Props {
	grade: string;
	/** What the letter hides: the score and what it was charged for. */
	hint?: string;
	class?: string;
};

let { grade, hint, class: className }: Props = $props();

const TONE: Record<string, string> = {
	A: "bg-success/12 text-success-800 dark:text-success",
	B: "bg-success/12 text-success-800 dark:text-success",
	C: "bg-muted text-foreground",
	D: "bg-warning/18 text-warning-800 dark:text-warning",
	E: "bg-destructive/12 text-destructive",
};
</script>

<span
	class={cn(
		"inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
		TONE[grade] ?? TONE.C,
		className,
	)}
	title={hint}
>
	{grade}
</span>

<script lang="ts">
	// One A to E grade on the shared tone scale, so a C means one thing everywhere.
	import { TONE_TINT, type Tone } from "#src/lib/tone.js";
	import { cn } from "#src/lib/utils.js";

	interface Props {
		grade: string;
		/** What the letter hides: the score and what it was charged for. */
		hint?: string;
		class?: string;
	}

	let { grade, hint, class: className }: Props = $props();

	const GRADE_TONE: Record<string, Tone> = {
		A: "success",
		B: "success",
		C: "neutral",
		D: "warning",
		E: "destructive",
	};
</script>

<span
	class={cn(
		"inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-semibold tabular-nums",
		TONE_TINT[GRADE_TONE[grade] ?? "neutral"],
		className,
	)}
	title={hint}
>
	{grade}
</span>

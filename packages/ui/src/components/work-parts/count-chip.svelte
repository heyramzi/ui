<script lang="ts">
	import { cn } from "#src/lib/utils.js";

	interface Props {
		count: number;
		class?: string;
	}

	let { count, class: className }: Props = $props();
</script>

<!-- A count beside a heading: a quiet square, never a pill, so it reads as a number and not a status. -->
<span
	class={cn(
		"grid h-5 min-w-5 shrink-0 place-items-center rounded-sm bg-foreground/5 px-1 text-xs font-medium text-muted-foreground tabular-nums",
		className,
	)}
>
	{count.toLocaleString()}
</span>

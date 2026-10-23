<script lang="ts">
	import type { Snippet } from "svelte";

	interface Props {
		label: string;
		children: Snippet;
	}

	let { label, children }: Props = $props();
</script>

<!-- A labelled row in the rail. In the narrow chip row the label hides and
     names the group for assistive tech. -->
<div
	class="flex min-h-7 items-center @3xl:grid @3xl:grid-cols-[6rem_minmax(0,1fr)]"
	role="group"
	aria-label={label}
>
	<span class="hidden text-xs font-medium text-muted-foreground @3xl:block" aria-hidden="true"
		>{label}</span
	>
	<div class="flex min-w-0 items-center">{@render children()}</div>
</div>

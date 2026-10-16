<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	export interface ReasoningProps extends CollapsiblePrimitive.RootProps {
		isStreaming?: boolean;
		duration?: number;
		children?: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from "@heyramzi/utils";
	import { Collapsible } from "#src/shadcn/collapsible/index.js";
	import { setReasoningContext } from "#src/ai/reasoning/reasoning-context.svelte.js";

	let {
		isStreaming = false,
		open = $bindable(false),
		duration = 0,
		class: className,
		children,
		...rest
	}: ReasoningProps = $props();

	// WHY: child parts read streaming/duration through this proxy; the $effect keeps
	// it synced to props so $derived in the trigger reruns on every change.
	const ctx = $state({ isStreaming, duration });
	$effect(() => {
		ctx.isStreaming = isStreaming;
		ctx.duration = duration;
	});
	setReasoningContext(ctx);

	// WHY: auto-open on stream start and auto-close on stream end, but only on the
	// transition itself so a user who toggles mid-stream is left alone.
	let prev = isStreaming;
	$effect(() => {
		if (isStreaming && !prev) open = true;
		else if (!isStreaming && prev) open = false;
		prev = isStreaming;
	});
</script>

<Collapsible bind:open class={cn("text-sm", className)} {...rest}>
	{@render children?.()}
</Collapsible>

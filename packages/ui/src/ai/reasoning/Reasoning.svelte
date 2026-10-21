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
	import { untrack } from "svelte";
	import { cn } from "#src/lib/utils.js";
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

	// WHY: child parts read streaming/duration through these getters, so $derived in
	// the trigger reruns whenever the props change.
	setReasoningContext({
		get isStreaming() {
			return isStreaming;
		},
		get duration() {
			return duration;
		},
	});

	// WHY: auto-open on stream start and auto-close on stream end, but only on the
	// transition itself so a user who toggles mid-stream is left alone.
	let prev = untrack(() => isStreaming);
	$effect(() => {
		if (isStreaming && !prev) open = true;
		else if (!isStreaming && prev) open = false;
		prev = isStreaming;
	});
</script>

<Collapsible bind:open class={cn("text-sm", className)} {...rest}>
	{@render children?.()}
</Collapsible>

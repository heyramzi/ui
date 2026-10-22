<script lang="ts">
	import { Reasoning, ReasoningContent, ReasoningTrigger } from "#src/ai/reasoning/index.js";
	import { SOURCE_ICON, SOURCE_LABEL } from "#src/tasks/inbox/inbox-statuses.js";
	import type { InboxTrace } from "#src/tasks/inbox/inbox-types.js";

	interface Props {
		trace: InboxTrace;
	}

	let { trace }: Props = $props();

	let count = $derived(trace.evidence.length);
	let SourceIcon = $derived(SOURCE_ICON[trace.source.type]);
</script>

<!-- WHY the shared Reasoning and not a local disclosure: it is already the
     collapsed-by-default "how the agent got here" pattern, with the same chevron. -->
<Reasoning>
	<ReasoningTrigger class="w-auto">
		<SourceIcon size={14} class="shrink-0" aria-hidden="true" />
		<span>
			Trace: {SOURCE_LABEL[trace.source.type]}, {trace.source.at}, {count}
			{count === 1 ? "quote" : "quotes"}
		</span>
	</ReasoningTrigger>
	<ReasoningContent>
		<div class="flex flex-col gap-3">
			<p class="text-foreground">
				{trace.source.label}
				{#if trace.source.href}
					<a href={trace.source.href} class="text-foreground ml-1 underline underline-offset-2"
						>Open source</a
					>
				{/if}
			</p>
			<ul class="flex flex-col gap-2">
				{#each trace.evidence as evidence, i (i)}
					<li>
						<blockquote class="text-foreground">&ldquo;{evidence.quote}&rdquo;</blockquote>
						{#if evidence.by || evidence.at}
							<span class="text-xs tabular-nums"
								>{[evidence.by, evidence.at].filter(Boolean).join(", ")}</span
							>
						{/if}
					</li>
				{/each}
			</ul>
			<p><span class="text-foreground font-medium">Why:</span> {trace.reasoning}</p>
		</div>
	</ReasoningContent>
</Reasoning>

<script lang="ts">
	import { Reasoning, ReasoningContent, ReasoningTrigger } from "#src/ai/reasoning/index.js";
	import type { InboxTrace } from "#src/work/inbox/inbox-types.js";

	interface Props {
		trace: InboxTrace;
		/** The reasoning no other line of the card says. Empty when the card already shows it. */
		reasoning?: string;
		/** The name the card's meta line shows, so the source label doesn't repeat it. */
		agent?: string;
	}

	let { trace, reasoning = "", agent }: Props = $props();

	let count = $derived(trace.evidence.length);
	let label = $derived(
		trace.source.label.trim() === agent?.trim() ? "" : trace.source.label.trim(),
	);
</script>

<!-- WHY the shared Reasoning and not a local disclosure: it is already the
     collapsed-by-default "how the agent got here" pattern, with the same chevron. -->
<Reasoning>
	<ReasoningTrigger class="w-auto">
		<span>Trace{count > 0 ? ` · ${count} ${count === 1 ? "quote" : "quotes"}` : ""}</span>
	</ReasoningTrigger>
	<ReasoningContent>
		<div class="flex flex-col gap-3">
			{#if label || trace.source.href}
				<p class="text-foreground">
					{label}
					{#if trace.source.href}
						<a href={trace.source.href} class="text-foreground underline underline-offset-2"
							>Open source</a
						>
					{/if}
				</p>
			{/if}
			{#if count > 0}
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
			{/if}
			{#if reasoning}
				<p><span class="text-foreground font-medium">Why:</span> {reasoning}</p>
			{/if}
		</div>
	</ReasoningContent>
</Reasoning>

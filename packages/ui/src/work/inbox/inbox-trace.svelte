<script lang="ts">
	import { Brain } from "phosphor-svelte";
	import * as Trace from "#src/shadcn/trace/index.js";
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

<Trace.Collapsible class="text-sm">
	<Trace.CollapsibleTrigger class="gap-2">
		<Trace.Line>
			<Trace.Icon><Brain aria-hidden="true" /></Trace.Icon>
			<Trace.Title
				>Trace{count > 0 ? ` · ${count} ${count === 1 ? "quote" : "quotes"}` : ""}</Trace.Title
			>
		</Trace.Line>
	</Trace.CollapsibleTrigger>
	<Trace.CollapsibleContent class="mt-3 mb-0 ml-0 border-l-2 pr-0 pl-3">
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
	</Trace.CollapsibleContent>
</Trace.Collapsible>

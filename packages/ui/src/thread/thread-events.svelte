<script lang="ts">
	import * as TraceUI from "#src/shadcn/trace/index.js";
	import type { ThreadEvent } from "#src/thread/types.js";

	interface Props {
		events: ThreadEvent[];
		when: (event: ThreadEvent) => string;
	}

	let { events, when }: Props = $props();
</script>

<!-- ps-1 centres each 16px icon in the 24px avatar column the comments use. -->
<TraceUI.Trace class="gap-1 ps-1">
	{#each events as event (event.id)}
		{@const Icon = event.icon}
		<TraceUI.Line class="w-full items-start text-xs">
			{#if Icon}
				<TraceUI.Icon class="mt-px"><Icon size={14} /></TraceUI.Icon>
			{/if}
			<!-- Wraps, not truncates: a status name can be a sentence, and a touch screen has no hover title. -->
			<TraceUI.Title class="flex-1 whitespace-normal text-pretty [overflow-wrap:anywhere]"
				>{event.title}</TraceUI.Title
			>
			<TraceUI.Description>
				<time datetime={event.at}>{when(event)}</time>
			</TraceUI.Description>
		</TraceUI.Line>
	{/each}
</TraceUI.Trace>

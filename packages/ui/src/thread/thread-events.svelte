<script lang="ts">
	import * as TraceUI from "#src/shadcn/trace/index.js";
	import { TagChip } from "#src/components/chip/index.js";
	import type { ThreadEvent } from "#src/thread/types.js";

	interface Props {
		events: ThreadEvent[];
		when: (event: ThreadEvent) => string;
	}

	let { events, when }: Props = $props();

	const TOKEN = "{record}";

	// The sentence around the chip. No token puts the chip at the end, so an older event with a
	// record and a plain title still reads in order.
	function split(event: ThreadEvent): [string, string] {
		const at = event.title.indexOf(TOKEN);
		if (at < 0) return [`${event.title} `, ""];
		return [event.title.slice(0, at), event.title.slice(at + TOKEN.length)];
	}
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
			<TraceUI.Title class="flex-1 whitespace-normal text-pretty [overflow-wrap:anywhere]">
				{#if event.record}
					{@const record = event.record}
					{@const [before, after] = split(event)}
					{before}{#if record.href}<a
							href={record.href}
							class="rounded-sm align-middle outline-none focus-visible:shadow-[var(--ring-focus)]"
							><TagChip>
								{#snippet icon()}{#if record.icon}{@const RecordIcon = record.icon}<RecordIcon
											aria-hidden="true"
										/>{/if}{/snippet}{record.label}</TagChip
							></a
						>{:else}<TagChip class="align-middle">
							{#snippet icon()}{#if record.icon}{@const RecordIcon = record.icon}<RecordIcon
										aria-hidden="true"
									/>{/if}{/snippet}{record.label}</TagChip
						>{/if}{after}
				{:else}
					{event.title}
				{/if}
			</TraceUI.Title>
			<TraceUI.Description>
				<time datetime={event.at}>{when(event)}</time>
			</TraceUI.Description>
		</TraceUI.Line>
	{/each}
</TraceUI.Trace>

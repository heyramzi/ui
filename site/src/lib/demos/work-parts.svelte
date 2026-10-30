<script lang="ts">
	import {
		GroupHead,
		PropertyRow,
		WorkCard,
		WorkWell,
		workLooks,
	} from "@heyramzi/ui/components/work-parts";
	import { CalendarBlank, User } from "phosphor-svelte";

	let held = $state(false);
</script>

<div class="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
	<div class="flex flex-col gap-2">
		<GroupHead label="In progress" hue="var(--color-info)" count={1} onAdd={() => {}} />
		<WorkWell
			hue="var(--color-info)"
			active={held}
			onpointerenter={() => (held = true)}
			onpointerleave={() => (held = false)}
		>
			<WorkCard>
				Send the signed SOW to the client
				{#snippet meta()}<span>Oct 28</span><span>2 of 5</span>{/snippet}
			</WorkCard>
			<div class="h-16 {workLooks.hole}" aria-hidden="true"></div>
		</WorkWell>
	</div>

	<div class="flex flex-col gap-1">
		<PropertyRow label="Assignee" icon={User}>
			<span class="text-sm">Ramzi</span>
		</PropertyRow>
		<PropertyRow label="Due" icon={CalendarBlank}>
			<span class="text-sm tabular-nums">28 Oct</span>
		</PropertyRow>
	</div>
</div>

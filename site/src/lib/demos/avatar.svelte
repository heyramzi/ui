<script lang="ts">
	import * as Avatar from "@heyramzi/ui/shadcn/avatar";

	const team = [
		{ initials: "AM", tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
		{ initials: "BO", tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
		{ initials: "CY", tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
	];
</script>

<div class="flex items-center gap-4">
	{#each team as member (member.initials)}
		<Avatar.Root>
			<Avatar.Fallback class={member.tone}>{member.initials}</Avatar.Fallback>
		</Avatar.Root>
	{/each}
	<div class="flex -space-x-2">
		{#each team as member (member.initials)}
			<Avatar.Root class="ring-2 ring-background">
				<Avatar.Fallback class={member.tone}>{member.initials}</Avatar.Fallback>
			</Avatar.Root>
		{/each}
	</div>
</div>

<script lang="ts">
	import { TagChip } from "@heyramzi/ui/components/chip";
	import { Tag } from "phosphor-svelte";

	let tags = $state(["Onboarding", "Invoices", "A label long enough to truncate inside its chip"]);
</script>

<div class="flex w-full max-w-sm flex-wrap items-center gap-1.5">
	<TagChip>Read only</TagChip>
	<TagChip>
		{#snippet icon()}<Tag aria-hidden="true" />{/snippet}
		With an icon
	</TagChip>
	{#each tags as tag (tag)}
		<TagChip
			class="max-w-48"
			removeLabel={`Remove ${tag}`}
			onRemove={() => {
				tags = tags.filter((t) => t !== tag);
			}}
		>
			{tag}
		</TagChip>
	{/each}
</div>

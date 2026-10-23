<script lang="ts">
	import { SectionCard } from "@heyramzi/ui/components/section-card";
	import { SectionHeader } from "@heyramzi/ui/components/section-header";
	import { FieldRow } from "@heyramzi/ui/components/field-row";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Input } from "@heyramzi/ui/shadcn/input";

	let name = $state("Northwind Studio");
</script>

<div class="flex w-full max-w-2xl flex-col gap-6">
	<SectionHeader title="Workspace" count={2} countLabel="settings" />
	<SectionCard title="General">
		{#snippet actions()}
			<Button size="sm" variant="outline">Reset</Button>
		{/snippet}
		<FieldRow
			label="Workspace name"
			for="workspace-name"
			description="Shown on invoices and the sign-in page."
		>
			<Input id="workspace-name" bind:value={name} />
			{#snippet action()}
				<Button disabled={name.trim() === ""}>Save</Button>
			{/snippet}
		</FieldRow>
	</SectionCard>
</div>

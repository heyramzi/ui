<script lang="ts">
	import { TableView, type TableColumn } from "@heyramzi/ui/components/table-view";
	import { SectionCard } from "@heyramzi/ui/components/section-card";
	import * as ContextMenu from "@heyramzi/ui/shadcn/context-menu";

	type Line = { id: string; item: string; hours: number; total: number };

	let lines = $state<Line[]>([
		{ id: "audit", item: "Audit and scoping", hours: 12, total: 1800 },
		{ id: "build", item: "Build the first module", hours: 40, total: 6000 },
		{ id: "handover", item: "Handover and training", hours: 8, total: 1200 },
	]);
	const columns: TableColumn<Line>[] = [
		{ key: "item", label: "Item" },
		{ key: "hours", label: "Hours", numeric: true, width: "6rem" },
		{
			key: "total",
			label: "Total",
			numeric: true,
			width: "8rem",
			format: (v) => `$${Number(v).toLocaleString("en-US")}`,
		},
	];
	let footer = $derived<Line>({
		id: "sum",
		item: "Total",
		hours: lines.reduce((sum, line) => sum + line.hours, 0),
		total: lines.reduce((sum, line) => sum + line.total, 0),
	});
</script>

<SectionCard title="Quote lines" flush class="w-full max-w-2xl">
	<TableView {columns} rows={lines} rowKey={(row) => row.id} label="Quote lines" {footer}>
		{#snippet rowMenu(row)}
			<ContextMenu.Item onclick={() => (lines = lines.filter((line) => line.id !== row.id))}>
				Remove line
			</ContextMenu.Item>
		{/snippet}
	</TableView>
</SectionCard>

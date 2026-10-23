<script lang="ts">
	import {
		Pagination,
		RowArrow,
		SortableHead,
		TableSkeleton,
		formatCount,
		normalizeQuery,
		anyContainsQuery,
		paginateRows,
		sortRows,
		toggleSort,
		type SortState,
	} from "@heyramzi/ui/components/data-table";
	import * as Table from "@heyramzi/ui/shadcn/table";
	import { Input } from "@heyramzi/ui/shadcn/input";
	import { Button } from "@heyramzi/ui/shadcn/button";

	type Client = { id: string; name: string; city: string; projects: number; revenue: number };

	const clients: Client[] = [
		{ id: "c1", name: "Northwind Legal", city: "Lyon", projects: 4, revenue: 18400 },
		{ id: "c2", name: "Acme Freight", city: "Rotterdam", projects: 2, revenue: 9600 },
		{ id: "c3", name: "Birchwood Logistics", city: "Leeds", projects: 1, revenue: 3200 },
		{ id: "c4", name: "Atelier Morel", city: "Paris", projects: 6, revenue: 27100 },
		{ id: "c5", name: "Harbor Dental", city: "Bordeaux", projects: 3, revenue: 12800 },
		{ id: "c6", name: "Kestrel Surveys", city: "Edinburgh", projects: 2, revenue: 7450 },
		{ id: "c7", name: "Maison Duval", city: "Lille", projects: 5, revenue: 21900 },
		{ id: "c8", name: "Pinewood Plumbing", city: "Bristol", projects: 1, revenue: 2800 },
		{ id: "c9", name: "Studio Verre", city: "Nantes", projects: 3, revenue: 11300 },
		{ id: "c10", name: "Tidewater Marine", city: "Antwerp", projects: 2, revenue: 8900 },
	];

	const pageSize = 4;

	let query = $state("");
	let sort = $state<SortState<Client>>({ key: "revenue", direction: "desc" });
	let page = $state(1);
	let loading = $state(false);

	let matches = $derived(
		clients.filter((c) => anyContainsQuery([c.name, c.city], normalizeQuery(query))),
	);
	let rows = $derived(paginateRows(sortRows(matches, sort), page, pageSize));

	function reload() {
		loading = true;
		setTimeout(() => (loading = false), 1200);
	}
</script>

<div class="flex w-full max-w-2xl flex-col gap-3">
	<div class="flex items-center gap-2">
		<Input
			bind:value={query}
			oninput={() => (page = 1)}
			placeholder="Search clients"
			aria-label="Search clients"
			class="max-w-56"
		/>
		<span class="text-sm tabular-nums text-muted-foreground">
			{formatCount(matches.length, clients.length, "clients")}
		</span>
		<Button variant="outline" size="sm" class="ms-auto" onclick={reload}>Reload</Button>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-card">
		{#if loading}
			<TableSkeleton rows={pageSize} columns={[{}, {}, { align: "right" }, { align: "right" }]} />
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<SortableHead key="name" {sort} onSort={(k) => (sort = toggleSort(sort, k))}
							>Client</SortableHead
						>
						<SortableHead key="city" {sort} onSort={(k) => (sort = toggleSort(sort, k))}
							>City</SortableHead
						>
						<SortableHead
							key="projects"
							{sort}
							onSort={(k) => (sort = toggleSort(sort, k))}
							class="text-right">Projects</SortableHead
						>
						<SortableHead
							key="revenue"
							{sort}
							onSort={(k) => (sort = toggleSort(sort, k))}
							class="text-right">Revenue</SortableHead
						>
						<Table.Head class="w-8"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rows as row (row.id)}
						<Table.Row class="group/row">
							<Table.Cell class="font-medium">{row.name}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{row.city}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{row.projects}</Table.Cell>
							<Table.Cell class="text-right tabular-nums"
								>€{row.revenue.toLocaleString("en-US")}</Table.Cell
							>
							<Table.Cell><RowArrow /></Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="h-24 text-center text-muted-foreground"
								>No client matches "{query}"</Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
			<Pagination {page} {pageSize} total={matches.length} onPageChange={(p) => (page = p)} />
		{/if}
	</div>
</div>

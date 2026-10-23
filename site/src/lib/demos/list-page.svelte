<script lang="ts">
	import {
		DetailHeader,
		DetailPanel,
		DetailRow,
		DetailStack,
		ListPageShell,
		MasterDetail,
		RailBody,
		RailHead,
		RailRow,
		ToolbarSearch,
	} from "@heyramzi/ui/components/list-page";
	import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Plus } from "phosphor-svelte";

	type Quote = {
		id: string;
		client: string;
		title: string;
		status: "draft" | "sent" | "won";
		total: string;
		owner: string;
		lines: [string, string][];
	};

	const quotes: Quote[] = [
		{
			id: "q-2041",
			client: "Northwind Legal",
			title: "Contract workflow",
			status: "sent",
			total: "€9,000",
			owner: "Ramzi",
			lines: [
				["Audit and scoping", "€1,800"],
				["Build the first module", "€6,000"],
				["Handover", "€1,200"],
			],
		},
		{
			id: "q-2040",
			client: "Acme Freight",
			title: "Onboarding automation",
			status: "draft",
			total: "€4,200",
			owner: "Camille",
			lines: [
				["Intake form", "€1,400"],
				["Welcome sequence", "€2,800"],
			],
		},
		{
			id: "q-2037",
			client: "Atelier Morel",
			title: "Studio bookings",
			status: "won",
			total: "€12,600",
			owner: "Ramzi",
			lines: [
				["Calendar sync", "€3,600"],
				["Deposit payments", "€5,400"],
				["Reminders", "€3,600"],
			],
		},
		{
			id: "q-2033",
			client: "Harbor Dental",
			title: "Recall campaign",
			status: "sent",
			total: "€2,950",
			owner: "Camille",
			lines: [
				["Patient list cleanup", "€950"],
				["Recall emails", "€2,000"],
			],
		},
	];

	let query = $state("");
	let status = $state("all");
	let selectedId = $state(quotes[0].id);

	let visible = $derived(
		quotes.filter(
			(q) =>
				(status === "all" || q.status === status) &&
				`${q.client} ${q.title}`.toLowerCase().includes(query.trim().toLowerCase()),
		),
	);
	let selected = $derived(visible.find((q) => q.id === selectedId) ?? visible[0]);
</script>

<div class="w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-background">
	<ListPageShell
		maxWidth={false}
		isEmpty={visible.length === 0}
		emptyState={{
			title: "No quote matches",
			description: "Try another name or clear the filter.",
			actionLabel: "Clear filter",
			onAction: () => {
				query = "";
				status = "all";
			},
		}}
	>
		{#snippet search()}
			<ToolbarSearch bind:value={query} placeholder="Search quotes" class="w-56" />
		{/snippet}
		{#snippet tabs()}
			<SegmentedFilter
				options={[
					{ value: "all", label: "All" },
					{ value: "draft", label: "Draft" },
					{ value: "sent", label: "Sent" },
					{ value: "won", label: "Won" },
				]}
				bind:value={status}
				ariaLabel="Status"
				block={false}
			/>
		{/snippet}
		{#snippet rightActions()}
			<Button size="sm"><Plus class="size-4" weight="bold" />New quote</Button>
		{/snippet}
		{#snippet content()}
			<div class="h-[26rem]">
				<MasterDetail pad={false} railWidth="minmax(220px, 280px)">
					{#snippet rail()}
						<div
							class="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card"
						>
							<RailHead label="{visible.length} quotes" />
							<RailBody>
								{#each visible as q (q.id)}
									<RailRow
										title={q.client}
										selected={q.id === selected?.id}
										onclick={() => (selectedId = q.id)}
										preview={q.title}
										meta={[q.status, q.total]}
									/>
								{/each}
							</RailBody>
						</div>
					{/snippet}
					{#snippet detail()}
						{#if selected}
							<DetailStack>
								<DetailHeader
									title={selected.client}
									meta={[selected.title, selected.id, selected.owner]}
								/>
								<DetailPanel label="Lines">
									{#each selected.lines as [item, amount] (item)}
										<DetailRow>
											<span>{item}</span>
											<span class="ms-auto tabular-nums">{amount}</span>
										</DetailRow>
									{/each}
									<DetailRow muted>
										<span>Total</span>
										<span class="ms-auto tabular-nums">{selected.total}</span>
									</DetailRow>
								</DetailPanel>
							</DetailStack>
						{/if}
					{/snippet}
				</MasterDetail>
			</div>
		{/snippet}
	</ListPageShell>
</div>

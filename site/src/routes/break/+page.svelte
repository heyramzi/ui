<script lang="ts">
	import { onMount } from "svelte";
	import { Mark } from "@heyramzi/ui/components/mark";
	import { SectionCard } from "@heyramzi/ui/components/section-card";
	import { SectionHeader } from "@heyramzi/ui/components/section-header";
	import { FieldRow } from "@heyramzi/ui/components/field-row";
	import { TableView, type TableColumn } from "@heyramzi/ui/components/table-view";
	import { Pagination, formatCount } from "@heyramzi/ui/components/data-table";
	import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
	import { DetailHeader, EmptyState, NoticeBar, RailRow } from "@heyramzi/ui/components/list-page";
	import { InfoList, type InfoRow } from "@heyramzi/ui/record";
	import { StatusBadge } from "@heyramzi/ui/status";
	import { Badge } from "@heyramzi/ui/shadcn/badge";
	import { Input } from "@heyramzi/ui/shadcn/input";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import * as Avatar from "@heyramzi/ui/shadcn/avatar";
	import { initials } from "@heyramzi/ui/lib/initials";
	import { Tray } from "phosphor-svelte";
	import { BAD_URL, MODES, people, type Mode, type Person } from "#lib/fixtures/break-fixtures.js";

	// Read on the client: the page is never prerendered, so the URL is there on mount.
	let mode = $state<Mode>("demo");
	onMount(() => {
		const q = new URL(location.href).searchParams.get("data");
		if (MODES.some((m) => m.value === q)) mode = q as Mode;
	});

	const rows = $derived(people(mode));
	const first = $derived(rows[0]);
	const sample = $derived(rows.slice(0, 12));

	const columns: TableColumn<Person>[] = [
		{ key: "name", label: "Name" },
		{ key: "email", label: "Email", muted: true },
		{ key: "role", label: "Role", hideBelow: "md" },
		{ key: "status", label: "Status" },
		{ key: "amount", label: "Amount", numeric: true },
		{ key: "count", label: "Members", numeric: true },
	];

	const infoRows = $derived<InfoRow[]>(
		first
			? [
					{ id: "name", label: "Name", value: first.name },
					{ id: "email", label: "Notification preferences and settings", value: first.email },
					{ id: "role", label: "Role", value: first.role || null, placeholder: "Add a role" },
					{ id: "site", label: "Site", value: BAD_URL, href: "https://example.com" },
					{ id: "tags", label: "Tags", chips: first.tags.map((label) => ({ label })) },
					{ id: "status", label: "Status", value: first.status, tone: "warning" },
				]
			: [],
	);

	const tabs = $derived([
		{ value: "all", label: "All", count: rows.length },
		{ value: "open", label: "Invitation expired 12 days ago", count: first?.count ?? 0 },
		{ value: "done", label: "Done" },
	]);
	let tab = $state("all");
	let page = $state(1);
	let mounted = $state(false);
	onMount(() => (mounted = true));
</script>

<svelte:head><title>Break UI | heyramzi/ui</title></svelte:head>

{#if import.meta.env.DEV && mounted}
	<div class="flex flex-col gap-10 py-12 pb-28">
		<h1 class="text-2xl font-semibold">Break UI</h1>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">Mark, Avatar, Badge in a 160px box</h2>
			<div class="flex w-40 flex-col gap-2 rounded-lg border p-3">
				{#each sample.slice(0, 5) as p (p.id)}
					<div class="flex items-center gap-2">
						<Mark src={p.avatar} label={p.name} shape="circle" />
						<Avatar.Root size="sm"
							><Avatar.Fallback>{initials(p.name)}</Avatar.Fallback></Avatar.Root
						>
						<StatusBadge tone="neutral">{p.status}</StatusBadge>
					</div>
				{/each}
				{#if first}<Badge>{first.role || "Empty role"}</Badge>{/if}
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">
				SectionHeader and SectionCard at 320px
			</h2>
			<div class="flex w-80 max-w-full flex-col gap-4">
				<SectionHeader
					title={first?.role || "Members"}
					count={first?.count ?? 0}
					description={first?.email}
				>
					{#snippet actions()}<Button size="sm">Invite</Button>{/snippet}
				</SectionHeader>
				<SectionCard title={first?.name || "Untitled"}>
					{formatCount(rows.length, rows.length, "members")}
					{#snippet actions()}<Button size="sm" variant="outline">Edit</Button>{/snippet}
				</SectionCard>
				<FieldRow label="Notification preferences and settings" for="b-email">
					<Input id="b-email" value={first?.email ?? ""} />
					{#snippet action()}<Button variant="outline">Save</Button>{/snippet}
				</FieldRow>
				<p class="text-sm">
					{formatCount(0, 1, "members")} | {formatCount(1, 1, "members")} | {formatCount(
						first?.count ?? 0,
						1000000,
						"members",
					)}
				</p>
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">
				RailRow and DetailHeader at 280px and 320px
			</h2>
			<div class="flex flex-wrap items-start gap-6">
				<div class="w-70 overflow-hidden rounded-lg border">
					{#each sample as p (p.id)}
						<RailRow
							title={p.name}
							preview={p.role}
							meta={[p.email, `${p.count.toLocaleString()} members`]}
							onclick={() => {}}
						>
							{#snippet leading()}<Mark
									src={p.avatar}
									label={p.name}
									shape="circle"
									class="size-8"
								/>{/snippet}
							{#snippet trailing()}<StatusBadge tone="info" capitalize={false}
									>{p.status}</StatusBadge
								>{/snippet}
						</RailRow>
					{:else}
						<p class="p-4 text-sm text-muted-foreground">No rows</p>
					{/each}
				</div>
				<div class="w-80 max-w-full">
					{#if first}
						<DetailHeader
							title={first.name || "Untitled"}
							meta={[first.email, first.role]}
							note={BAD_URL}
						>
							{#snippet badge()}<StatusBadge tone="warning" capitalize={false}
									>{first.status}</StatusBadge
								>{/snippet}
							{#snippet actions()}<Button size="sm">Resend invitation</Button>{/snippet}
						</DetailHeader>
					{/if}
				</div>
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">EmptyState and NoticeBar at 320px</h2>
			<div class="flex w-80 max-w-full flex-col gap-4">
				<EmptyState
					icon={Tray}
					title={first?.role || "Start your first launch"}
					description={BAD_URL}
					actionLabel="Invite the first member"
					onAction={() => {}}
				/>
				<NoticeBar tone="warning">
					{first?.email ?? "Nothing to flag"}
					{#snippet actions()}<Button size="sm" variant="outline">Retry</Button>{/snippet}
				</NoticeBar>
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">
				InfoList, list and row layouts at 320px
			</h2>
			<div class="flex w-80 max-w-full flex-col gap-6">
				<InfoList rows={infoRows} title="Details" />
				<InfoList rows={infoRows} layout="row" labelPosition="beside" />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">SegmentedFilter at 320px</h2>
			<div class="w-80 max-w-full">
				<SegmentedFilter ariaLabel="Filter" options={tabs} bind:value={tab} />
			</div>
		</section>

		<section class="flex flex-col gap-3">
			<h2 class="text-sm font-medium text-muted-foreground">
				TableView and Pagination at the page width
			</h2>
			<TableView {columns} rows={sample} rowKey={(row) => row.id} label="Members">
				{#snippet empty()}<span class="text-muted-foreground">No members</span>{/snippet}
			</TableView>
			<Pagination {page} pageSize={25} total={rows.length} onPageChange={(next) => (page = next)} />
		</section>
	</div>
{/if}

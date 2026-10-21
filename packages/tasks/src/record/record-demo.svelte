<script lang="ts">
// =========================
// IMPORTS
// =========================
import { DotsThree, NotePencil } from "phosphor-svelte";
import { SegmentedFilter } from "@heyramzi/ui/components/segmented";
import { Button } from "@heyramzi/ui/shadcn/button";
import { Input } from "@heyramzi/ui/shadcn/input";
import * as Tabs from "@heyramzi/ui/shadcn/tabs";
import RecordShell from "#src/record/record-shell.svelte";
import RecordHeader from "#src/record/record-header.svelte";
import WhereWeAre from "#src/record/where-we-are.svelte";
import NextUp from "#src/record/next-up.svelte";
import RecordStats from "#src/record/record-stats.svelte";
import StepsRail from "#src/record/steps-rail.svelte";
import RecordTimeline from "#src/record/record-timeline.svelte";
import ProjectList from "#src/record/project-list.svelte";
import FieldSection from "#src/record/field-section.svelte";
import InfoList from "#src/record/info-list.svelte";
import { formatAge, formatMoney, formatRange } from "#src/record/format.js";
import {
	latestWhereWeAre,
	mergeClientEvents,
	nextAcrossProjects,
	rollupProjects,
	stepProgress,
} from "#src/record/logic.js";
import type { FieldValue, RecordEvent, StepDef } from "#src/record/types.js";
import {
	DEMO_NOW,
	DEMO_TODAY,
	clientFields,
	clientOnlyEvents,
	clientProjects,
	clientSections,
	clientValues,
	projectFields,
	projectSections,
	stages,
	stepGroups,
	website,
	websiteEvents,
	websiteSteps,
	websiteValues,
} from "#src/record/demo-data.js";

// =========================
// STATE
// =========================
type Fixture = "project" | "client";
let fixture = $state<Fixture>("project");
let narrow = $state(false);
let tab = $state<"activity" | "notes">("activity");
let filter = $state("all");
let steps = $state<StepDef[]>(structuredClone(websiteSteps));
let activeStep = $state<string | null>("s2");
let projectValues = $state<Record<string, FieldValue | undefined>>({ ...websiteValues });
let personValues = $state<Record<string, FieldValue | undefined>>({ ...clientValues });
let extra = $state<RecordEvent[]>([]);
let draftNote = $state("");
let railOpen = $state(false);

// =========================
// DERIVED
// =========================
const locale = "en-GB";
let projectEvents = $derived([...extra, ...websiteEvents]);
let clientEvents = $derived(
	mergeClientEvents(
		clientOnlyEvents,
		clientProjects.map((p) => ({
			id: p.summary.id,
			name: p.summary.name,
			href: p.summary.href,
			events: p.events,
		})),
	),
);
let summaries = $derived(clientProjects.map((p) => p.summary));
let rollup = $derived(rollupProjects(summaries, stages));
let latest = $derived(latestWhereWeAre(summaries));
let next = $derived(nextAcrossProjects(summaries, stages));
let progress = $derived(stepProgress(steps));
let notes = $derived(projectEvents.filter((e) => e.kind === "note"));
let stage = $derived(stages.find((s) => s.key === website.stageKey));

let clientStats = $derived.by(() => {
	const eur = rollup.totals.EUR;
	return [
		{ label: "Projects", value: String(rollup.count), sub: `${rollup.activeCount} active` },
		{ label: "Pipeline", value: formatMoney(eur?.pipeline ?? 0, "EUR", locale, true) },
		{ label: "Won", value: formatMoney(eur?.won ?? 0, "EUR", locale, true) },
		{ label: "Paid", value: formatMoney(eur?.paid ?? 0, "EUR", locale, true), tone: "good" as const },
		{ label: "Last call", value: rollup.lastCallAt ? formatAge(rollup.lastCallAt, DEMO_NOW, locale) : "None yet" },
	];
});

// =========================
// FUNCTIONS
// =========================
function addNote() {
	const title = draftNote.trim();
	if (!title) return;
	extra = [
		{ id: `n${extra.length}`, kind: "note", occurredAt: DEMO_NOW.toISOString(), title, actor: "Ramzi" },
		...extra,
	];
	draftNote = "";
}

// A real host would round-trip here. The pause lets the rail show its optimistic order.
async function pause() {
	await new Promise((resolve) => setTimeout(resolve, 250));
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet composer()}
	<form
		class="flex items-center gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			addNote();
		}}
	>
		<Input bind:value={draftNote} placeholder="Write a note" aria-label="Write a note" class="flex-1" />
		<Button type="submit" variant="outline" disabled={!draftNote.trim()}>
			<NotePencil data-icon="inline-start" />
			Add
		</Button>
	</form>
{/snippet}

{#snippet payment(event: RecordEvent)}
	<p class="text-sm leading-snug font-medium">{event.title}</p>
	<p class="text-lg font-semibold tabular-nums text-success">
		{formatMoney(event.amount ?? 0, event.currency ?? "EUR", locale)}
	</p>
{/snippet}

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-3">
		<SegmentedFilter
			ariaLabel="Record"
			block={false}
			value={fixture}
			onValueChange={(v) => (fixture = v)}
			options={[
				{ value: "project", label: "One project" },
				{ value: "client", label: "Client with 3 projects" },
			]}
		/>
		<SegmentedFilter
			ariaLabel="Width"
			block={false}
			value={narrow ? "narrow" : "full"}
			onValueChange={(v) => (narrow = v === "narrow")}
			options={[
				{ value: "full", label: "Full width" },
				{ value: "narrow", label: "390px" },
			]}
		/>
	</div>

	<div class={narrow ? "mx-auto w-full max-w-[390px]" : "w-full"}>
		<div class="overflow-hidden rounded-xl border border-border">
			{#if fixture === "project"}
				<RecordShell
					bind:tab
					bind:railOpen
					tabs={[
						{ value: "activity", label: "Activity", count: projectEvents.length },
						{ value: "notes", label: "Notes", count: notes.length },
					]}
					tabsLabel="Project views"
					railProgress={progress}
				>
					{#snippet header()}
						<RecordHeader
							title={website.name}
							parent={{ label: "Marlow & Finch", href: "#client" }}
							stage={stage ? { label: stage.label, tone: stage.tone } : null}
							facts={[
								formatMoney(website.value ?? 0, "EUR", locale),
								formatRange(website.startDate ?? "", website.endDate, locale),
							]}
						>
							{#snippet actions()}
								<Button variant="ghost" size="sm" icon aria-label="More actions"><DotsThree weight="bold" /></Button>
							{/snippet}
						</RecordHeader>
					{/snippet}
					{#snippet banner()}
						<WhereWeAre
							note={website.whereWeAre?.text}
							at={website.whereWeAre?.at}
							actor={website.whereWeAre?.actor}
							health={website.whereWeAre?.health}
							now={DEMO_NOW}
							{locale}
						/>
						<NextUp next={website.next} today={DEMO_TODAY} {locale} />
					{/snippet}
					<Tabs.Content value="activity" class="mt-0">
						<RecordTimeline
							events={projectEvents}
							bind:filter
							{composer}
							entry={{ payment }}
							today={DEMO_TODAY}
							timeZone="UTC"
							{locale}
						/>
					</Tabs.Content>
					<Tabs.Content value="notes" class="mt-0">
						<RecordTimeline events={notes} {composer} today={DEMO_TODAY} timeZone="UTC" {locale} />
					</Tabs.Content>
					{#snippet rail()}
						<div class="flex flex-col gap-6">
							<StepsRail
								{steps}
								groups={stepGroups}
								activeId={activeStep}
								today={DEMO_TODAY}
								{locale}
								onSelect={(id) => (activeStep = id)}
								onToggle={(id, visible) => {
									steps = steps.map((s) => (s.id === id ? { ...s, hidden: !visible } : s));
								}}
								onReorder={async (ids) => {
									await pause();
									const byId = new Map(steps.map((s) => [s.id, s]));
									steps = ids.flatMap((id) => byId.get(id) ?? []);
								}}
								onRename={(id, label) => {
									const original = websiteSteps.find((s) => s.id === id)?.label ?? "";
									steps = steps.map((s) =>
										s.id === id ? { ...s, label: label || original, renamed: label !== "" } : s,
									);
								}}
							/>
							<InfoList
								title="People"
								rows={[
									{ id: "contact", label: "Contact", value: "Jane Roe, CFO" },
									{ id: "owner", label: "Owner", value: "Ramzi" },
								]}
							/>
							<FieldSection
								fields={projectFields}
								sections={projectSections}
								values={projectValues}
								currency="EUR"
								{locale}
								onSave={async (key, value) => {
									await pause();
									projectValues = { ...projectValues, [key]: value };
								}}
							/>
						</div>
					{/snippet}
				</RecordShell>
			{:else}
				<RecordShell bind:railOpen railTitle="Projects">
					{#snippet header()}
						<RecordHeader
							title="Marlow & Finch"
							parent={{ label: "Clients", href: "#clients" }}
							facts={[
								`Pipeline ${formatMoney(rollup.totals.EUR?.pipeline ?? 0, "EUR", locale, true)}`,
								`Won ${formatMoney(rollup.totals.EUR?.won ?? 0, "EUR", locale, true)}`,
							]}
						>
							<RecordStats stats={clientStats} gutter={false} />
						</RecordHeader>
					{/snippet}
					{#snippet banner()}
						<WhereWeAre
							note={latest?.text}
							at={latest?.at}
							actor={latest?.actor}
							health={latest?.health}
							project={latest ? { name: latest.projectName } : null}
							now={DEMO_NOW}
							{locale}
						/>
						<NextUp {next} showProject today={DEMO_TODAY} {locale} />
					{/snippet}
					<RecordTimeline
						events={clientEvents}
						bind:filter
						showProject
						entry={{ payment }}
						today={DEMO_TODAY}
						timeZone="UTC"
						{locale}
					/>
					{#snippet rail()}
						<div class="flex flex-col gap-6">
							<section class="flex flex-col gap-2">
								<h2 class="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
									Projects
								</h2>
								<ProjectList projects={summaries} {stages} today={DEMO_TODAY} {locale} />
							</section>
							<FieldSection
								fields={clientFields}
								sections={clientSections}
								values={personValues}
								{locale}
								onSave={async (key, value) => {
									await pause();
									personValues = { ...personValues, [key]: value };
								}}
							/>
						</div>
					{/snippet}
				</RecordShell>
			{/if}
		</div>
	</div>
</div>

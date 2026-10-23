<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "#src/lib/utils.js";
	import { Progress } from "#src/shadcn/progress/index.js";
	import { TONE_TEXT } from "#src/lib/tone.js";
	import StatusBadge from "#src/status/status-badge.svelte";
	import { todayIso } from "#src/work/dates.js";
	import { formatMoney, formatRange } from "#src/record/format.js";
	import {
		resolveLabels,
		type RecordLabels,
		type RecordSummary,
		type StageDef,
	} from "#src/record/types.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		projects: RecordSummary[];
		/** The agency's stages: each project draws its stage's label and tone. */
		stages: StageDef[];
		/** A project being looked at, marked in the list. */
		activeId?: string | null;
		/** Money shown when a project has none of its own. */
		currency?: string;
		labels?: Partial<RecordLabels>;
		locale?: string;
		/** ISO date. Decides "late". Defaults to the viewer's today. */
		today?: string;
		class?: string;
	}
	let {
		projects,
		stages,
		activeId = null,
		currency = "EUR",
		labels,
		locale,
		today = todayIso(),
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let t = $derived(resolveLabels(labels));
	let stageByKey = $derived(new Map(stages.map((s) => [s.key, s])));
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet row(project: RecordSummary)}
	{@const stage = stageByKey.get(project.stageKey)}
	{@const next = project.next}
	{@const late = Boolean(next?.date && (next.endDate ?? next.date).slice(0, 10) < today)}
	<span class="flex items-start justify-between gap-3">
		<span class="min-w-0 truncate text-sm font-medium">{project.name}</span>
		{#if project.value != null}
			<span class="shrink-0 text-sm tabular-nums text-muted-foreground">
				{formatMoney(project.value, project.currency ?? currency, locale, true)}
			</span>
		{/if}
	</span>
	<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
		<StatusBadge tone={stage?.tone ?? "neutral"} dot capitalize={false}>
			{stage ? stage.label : project.stageKey}{project.stageDetail
				? ` · ${project.stageDetail}`
				: ""}
		</StatusBadge>
		{#if project.whereWeAre?.health}
			<StatusBadge tone={project.whereWeAre.health.tone} capitalize={false}>
				{project.whereWeAre.health.label}
			</StatusBadge>
		{/if}
	</span>
	{#if project.whereWeAre?.text}
		<span class="line-clamp-2 text-xs leading-snug text-muted-foreground"
			>{project.whereWeAre.text}</span
		>
	{/if}
	{#if project.progress && project.progress.total > 0}
		<span class="flex items-center gap-2">
			<Progress
				value={(project.progress.done / project.progress.total) * 100}
				tone={project.progress.done === project.progress.total ? "success" : undefined}
				max={100}
				class="h-1 flex-1"
				aria-label={t.stepsCount(project.progress.done, project.progress.total)}
			/>
			<span class="text-xs tabular-nums text-muted-foreground">
				{t.stepsCount(project.progress.done, project.progress.total)}
			</span>
		</span>
	{/if}
	{#if next}
		<span class="flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
			<span>{t.next}</span>
			{#if next.date}
				<span class={cn("tabular-nums", late && TONE_TEXT.warning)}
					>{formatRange(next.date, next.endDate, locale)}</span
				>
			{/if}
			<span class="min-w-0 truncate text-foreground">{next.label}</span>
		</span>
	{/if}
{/snippet}

{#if projects.length === 0}
	<p class={cn("text-sm text-muted-foreground", className)}>{t.noProjects}</p>
{:else}
	<ul class={cn("flex flex-col gap-1", className)}>
		{#each projects as project (project.id)}
			{@const active = project.id === activeId}
			<li>
				{#if project.href}
					<a
						href={project.href}
						aria-current={active ? "page" : undefined}
						class={cn(
							"flex flex-col gap-1.5 rounded-lg px-2 py-2 transition-colors any-pointer-coarse:py-3",
							"outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
							active ? "bg-muted" : "hover:bg-muted/60",
						)}
					>
						{@render row(project)}
					</a>
				{:else}
					<div class={cn("flex flex-col gap-1.5 rounded-lg px-2 py-2", active && "bg-muted")}>
						{@render row(project)}
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

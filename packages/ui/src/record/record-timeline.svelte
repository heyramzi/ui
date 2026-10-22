<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Snippet } from "svelte";
	import { Circle } from "phosphor-svelte";
	import { SvelteSet } from "svelte/reactivity";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import { Badge } from "#src/shadcn/badge/index.js";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";
	import { SegmentedFilter } from "#src/components/segmented/index.js";
	import { TONE_ICON } from "#src/lib/tone.js";
	import { DEFAULT_RECORD_FILTERS, DEFAULT_RECORD_KINDS } from "#src/record/kinds.js";
	import { formatDayHeader, formatMoney, formatTime } from "#src/record/format.js";
	import {
		dayRelation,
		eventsForFilter,
		filterCounts,
		foldGroups,
		groupEventsByDay,
		localDay,
	} from "#src/record/logic.js";
	import {
		resolveLabels,
		type RecordEvent,
		type RecordFilterDef,
		type RecordKindDef,
		type RecordLabels,
	} from "#src/record/types.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		events: RecordEvent[];
		kinds?: RecordKindDef[];
		filters?: RecordFilterDef[];
		/** The chip picked: `all` or a filter key. */
		filter?: string;
		/** Draws a kind's content in place of the default title and body. The time,
	    the project chip and the amount stay the timeline's. */
		entry?: Record<string, Snippet<[RecordEvent]>>;
		/** Client mode: a chip on each entry says which project it came from. */
		showProject?: boolean;
		/** Entries drawn before the rest fold behind one button. */
		limit?: number;
		/** Above the list: a note composer, a status form. */
		composer?: Snippet;
		loading?: boolean;
		labels?: Partial<RecordLabels>;
		locale?: string;
		/** IANA zone for day boundaries. Defaults to the viewer's own. */
		timeZone?: string;
		/** ISO date for "Today". Defaults to the viewer's today. */
		today?: string;
		class?: string;
	}
	let {
		events,
		kinds = DEFAULT_RECORD_KINDS,
		filters = DEFAULT_RECORD_FILTERS,
		filter = $bindable("all"),
		entry,
		showProject = false,
		limit = 30,
		composer,
		loading = false,
		labels,
		locale,
		timeZone,
		today,
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let showAll = $state(false);
	const expanded = new SvelteSet<string>();

	// =========================
	// DERIVED
	// =========================
	let t = $derived(resolveLabels(labels));
	let kindByKey = $derived(new Map(kinds.map((k) => [k.key, k])));
	let counts = $derived(filterCounts(events, filters));
	let chips = $derived([
		{ value: "all", label: t.all, count: events.length },
		...filters
			.filter((f) => (counts[f.key] ?? 0) > 0)
			.map((f) => ({ value: f.key, label: f.label, count: counts[f.key] })),
	]);
	let shown = $derived(eventsForFilter(events, filter, filters));
	let grouped = $derived(groupEventsByDay(shown, timeZone));
	let folded = $derived(showAll ? { groups: grouped, hidden: 0 } : foldGroups(grouped, limit));
	let todayDay = $derived(today ?? localDay(new Date().toISOString(), timeZone));

	// =========================
	// FUNCTIONS
	// =========================
	function dayLabel(day: string): string {
		const relation = dayRelation(day, todayDay);
		if (relation === "today") return t.today;
		if (relation === "yesterday") return t.yesterday;
		return formatDayHeader(day, locale);
	}

	function kindOf(event: RecordEvent): RecordKindDef {
		return kindByKey.get(event.kind) ?? { key: event.kind, label: event.kind };
	}

	// A body this long, or with a line break, gets a More toggle. Measuring each
	// row would re-layout the list on every resize.
	function isLong(body: string | null | undefined): boolean {
		return Boolean(body && (body.length > 180 || body.includes("\n")));
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("flex min-w-0 flex-col gap-4", className)}>
	{@render composer?.()}

	{#if chips.length > 1}
		<div class="no-scrollbar -mx-1 overflow-x-auto px-1">
			<SegmentedFilter
				options={chips}
				bind:value={filter}
				ariaLabel={t.activity}
				block={false}
				max="none"
			/>
		</div>
	{/if}

	{#if loading}
		<div class="flex flex-col gap-3">
			{#each [0, 1, 2] as i (i)}
				<Skeleton class="h-12" />
			{/each}
		</div>
	{:else if grouped.length === 0}
		<p class="py-6 text-sm text-muted-foreground">{t.noEvents}</p>
	{:else}
		<div class="flex flex-col gap-5">
			{#each folded.groups as group (group.day)}
				<section class="flex flex-col gap-1">
					<h3 class="text-xs font-medium text-muted-foreground">{dayLabel(group.day)}</h3>
					<ul class="flex flex-col">
						{#each group.events as event (event.id)}
							{@const kind = kindOf(event)}
							{@const Icon = kind.icon ?? Circle}
							{@const custom = entry?.[event.kind]}
							<li class="flex gap-3 border-b border-border/60 py-3 last:border-b-0">
								<span
									class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted"
								>
									<Icon
										class={cn("size-3.5", TONE_ICON[kind.tone ?? "neutral"])}
										aria-hidden="true"
									/>
									<span class="sr-only">{kind.label}</span>
								</span>
								<div class="min-w-0 flex-1">
									{#if custom}
										{@render custom(event)}
									{:else}
										<p class="text-sm leading-snug font-medium wrap-anywhere">
											{#if event.href}
												<a href={event.href} class="underline-offset-2 hover:underline"
													>{event.title}</a
												>
											{:else}
												{event.title}
											{/if}
										</p>
										{#if event.body}
											<p
												class={cn(
													"mt-0.5 text-sm leading-snug whitespace-pre-line text-muted-foreground wrap-anywhere",
													!expanded.has(event.id) && "line-clamp-3",
												)}
											>
												{event.body}
											</p>
											{#if isLong(event.body)}
												<Button
													variant="ghost"
													size="sm"
													class="-ml-2 text-muted-foreground"
													aria-expanded={expanded.has(event.id)}
													onclick={() =>
														expanded.has(event.id)
															? expanded.delete(event.id)
															: expanded.add(event.id)}
												>
													{expanded.has(event.id) ? t.less : t.more}
												</Button>
											{/if}
										{/if}
										{#if event.details?.length}
											<dl class="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
												{#each event.details as detail (detail.label)}
													<div class="flex gap-1.5">
														<dt class="text-muted-foreground">{detail.label}</dt>
														<dd class="font-medium">{detail.value}</dd>
													</div>
												{/each}
											</dl>
										{/if}
									{/if}
									<p
										class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"
									>
										<span class="tabular-nums"
											>{formatTime(event.occurredAt, locale, timeZone)}</span
										>
										<span>{kind.label}</span>
										{#if event.amount != null}
											<span class="font-medium text-foreground tabular-nums">
												{formatMoney(event.amount, event.currency ?? undefined, locale)}
											</span>
										{/if}
										{#if event.actor}<span>{t.by(event.actor)}</span>{/if}
										{#if event.edited}<span>{t.edited}</span>{/if}
										{#if showProject && event.projectName}
											<Badge
												variant="outline"
												href={event.projectHref ?? undefined}
												class="max-w-48 truncate"
											>
												{event.projectName}
											</Badge>
										{/if}
									</p>
								</div>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		</div>
		{#if folded.hidden > 0}
			<Button variant="outline" class="w-fit self-start" onclick={() => (showAll = true)}>
				{t.older(folded.hidden)}
			</Button>
		{/if}
	{/if}
</div>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { ArrowRight } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { TONE_TEXT } from "#src/lib/tone.js";
	import StatusBadge from "#src/status/status-badge.svelte";
	import { gutterClass } from "#src/record/gutter.js";
	import { formatRange } from "#src/record/format.js";
	import { todayIso } from "#src/tasks/dates.js";
	import { resolveLabels, type RecordLabels, type RecordNext } from "#src/record/types.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		next?: RecordNext | null;
		/** Client mode: say which project the next step belongs to. */
		showProject?: boolean;
		labels?: Partial<RecordLabels>;
		locale?: string;
		/** ISO date. Decides "late". Defaults to the viewer's today. */
		today?: string;
		class?: string;
	}
	let {
		next,
		showProject = false,
		labels,
		locale,
		today = todayIso(),
		class: className,
	}: Props = $props();

	// =========================
	// DERIVED
	// =========================
	let t = $derived(resolveLabels(labels));
	let due = $derived((next?.endDate ?? next?.date)?.slice(0, 10));
	let late = $derived(due !== undefined && due < today);
	let when = $derived(next?.date ? formatRange(next.date, next.endDate, locale) : null);
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if next}
	<section
		aria-label={t.next}
		class={cn(
			"flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-border py-2 text-sm",
			gutterClass,
			className,
		)}
	>
		<ArrowRight class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
		<span class="font-medium">{t.next}</span>
		{#if when}
			<span class={cn("tabular-nums", late ? TONE_TEXT.warning : "text-muted-foreground")}
				>{when}</span
			>
		{/if}
		{#if next.href}
			<a href={next.href} class="min-w-0 truncate underline-offset-2 hover:underline"
				>{next.label}</a
			>
		{:else}
			<span class="min-w-0 truncate">{next.label}</span>
		{/if}
		{#if next.owner}
			<span class="text-muted-foreground">{next.owner}</span>
		{/if}
		{#if showProject && next.projectName}
			<span class="text-muted-foreground">{next.projectName}</span>
		{/if}
		{#if late}
			<StatusBadge tone="warning" capitalize={false}>{t.late}</StatusBadge>
		{/if}
	</section>
{/if}

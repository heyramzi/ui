<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { NavigationArrow } from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import { Button } from "#src/shadcn/button/index.js";
	import StatusBadge from "#src/status/status-badge.svelte";
	import type { Tone } from "#src/lib/tone.js";
	import { gutterClass } from "#src/record/gutter.js";
	import { formatAge } from "#src/record/format.js";
	import { resolveLabels, type RecordLabels } from "#src/record/types.js";

	// =========================
	// PROPS
	// =========================
	interface Props {
		/** The status note. Nothing draws without it. */
		note?: string | null;
		/** ISO timestamp of the note. */
		at?: string | null;
		actor?: string | null;
		health?: { label: string; tone: Tone } | null;
		/** Client mode: the project this note belongs to. */
		project?: { name: string; href?: string | null } | null;
		labels?: Partial<RecordLabels>;
		locale?: string;
		now?: Date | number;
		class?: string;
	}
	let { note, at, actor, health, project, labels, locale, now, class: className }: Props = $props();

	// =========================
	// STATE
	// =========================
	let expanded = $state(false);
	let clamped = $state(false);
	let text = $state<HTMLElement | null>(null);

	// =========================
	// DERIVED
	// =========================
	let t = $derived(resolveLabels(labels));
	let age = $derived(at ? formatAge(at, now, locale) : null);
	let hasMeta = $derived(Boolean(health || actor || age));

	// =========================
	// EFFECTS
	// =========================
	// Measured, not guessed from length: a note that fits two lines at 1280px
	// overflows at 390px, and "More" shows only when text is cut.
	$effect(() => {
		if (!text) return;
		const el = text;
		const measure = () => {
			if (!expanded) clamped = el.scrollHeight > el.clientHeight + 1;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if note}
	<section
		aria-label={t.whereWeAre}
		class={cn(
			"flex items-start gap-2.5 border-b border-border bg-muted/40 py-2.5",
			gutterClass,
			className,
		)}
	>
		<NavigationArrow
			class="mt-0.5 size-3.5 shrink-0 text-[color:var(--tone-accent,var(--color-primary))]"
			weight="fill"
			aria-hidden="true"
		/>
		<div class="min-w-0 flex-1">
			<!-- No `title` attribute: a native tooltip would repeat the whole note
			     over the steps list. "More" opens it in place. -->
			<p
				bind:this={text}
				class={cn("text-sm leading-snug text-muted-foreground", !expanded && "line-clamp-2")}
			>
				<span class="font-medium text-foreground">{t.whereWeAre}</span>
				{#if project}
					{#if project.href}
						<a
							href={project.href}
							class="font-medium text-foreground underline-offset-2 hover:underline"
							>{project.name}</a
						>
					{:else}
						<span class="font-medium text-foreground">{project.name}</span>
					{/if}
				{/if}
				<span class="whitespace-pre-line">{note}</span>
			</p>
			{#if hasMeta}
				<p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
					{#if health}
						<StatusBadge tone={health.tone} dot capitalize={false}>{health.label}</StatusBadge>
					{/if}
					{#if actor}<span>{t.by(actor)}</span>{/if}
					{#if age}<span class="tabular-nums">{age}</span>{/if}
				</p>
			{/if}
		</div>
		{#if clamped || expanded}
			<Button
				variant="ghost"
				size="sm"
				class="-mr-2 shrink-0 text-muted-foreground"
				aria-expanded={expanded}
				onclick={() => (expanded = !expanded)}
			>
				{expanded ? t.less : t.more}
			</Button>
		{/if}
	</section>
{/if}

<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import { CaretLeft } from "phosphor-svelte";
import { cn } from "#src/lib/utils.js";
import type { Tone } from "#src/lib/tone.js";
import StatusBadge from "#src/status/status-badge.svelte";
import { gutterClass } from "#src/record/gutter.js";

// =========================
// PROPS
// =========================
interface Props {
	title: string;
	/** A mark drawn before the title: a logo, an avatar. */
	logo?: Snippet;
	/** The stage, in the agency's own word and the tone of its category. */
	stage?: { label: string; tone: Tone; detail?: string | null } | null;
	/** What this record sits under, such as the client of a project. */
	parent?: { label: string; href: string } | null;
	/** Quiet facts after the stage: a value, dates. */
	facts?: string[];
	actions?: Snippet;
	/** Under the title row, for a stat strip. */
	children?: Snippet;
	class?: string;
}
let { title, logo, stage, parent, facts = [], actions, children, class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<header class={cn("flex flex-col gap-2 border-b border-border py-3", gutterClass, className)}>
	{#if parent}
		<a
			href={parent.href}
			class="-ml-1 inline-flex min-h-6 w-fit max-w-full items-center gap-0.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground any-pointer-coarse:min-h-11"
		>
			<CaretLeft class="size-3.5 shrink-0" aria-hidden="true" />
			<span class="truncate">{parent.label}</span>
		</a>
	{/if}
	<div class="flex items-start justify-between gap-3">
		<div class="flex min-w-0 items-center gap-3">
			{#if logo}<span class="shrink-0">{@render logo()}</span>{/if}
			<div class="min-w-0">
				<h1 class="truncate text-lg leading-tight font-semibold tracking-tight">{title}</h1>
				{#if stage || facts.length > 0}
					<p class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
						{#if stage}
							<StatusBadge tone={stage.tone} dot capitalize={false}
								>{stage.detail ? `${stage.label} · ${stage.detail}` : stage.label}</StatusBadge
							>
						{/if}
						{#each facts as fact, i (i)}
							<span class="tabular-nums">{fact}</span>
						{/each}
					</p>
				{/if}
			</div>
		</div>
		{#if actions}
			<div class="flex shrink-0 items-center gap-1">{@render actions()}</div>
		{/if}
	</div>
	{@render children?.()}
</header>

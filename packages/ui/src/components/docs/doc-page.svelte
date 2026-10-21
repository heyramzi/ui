<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import type { Component, Snippet } from "svelte";
	import OnThisPage from "#src/components/docs/on-this-page.svelte";
	import {
		ScrollSpy,
		type DocHeading,
		type LocateHeading,
	} from "#src/components/docs/scroll-spy.svelte.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		title: string;
		/** One line under the title. Optional: a page with nothing to add leaves it out. */
		summary?: string;
		icon?: Component<{ class?: string; weight?: "bold" }>;
		/** Where the page lives, as a reader would say it: "Marketing / Reports". */
		section?: string;
		/** Already worded and localised: "Updated 30 Jul 2026". */
		updated?: string;
		/** Room at the right of the title for a page's own controls. */
		actions?: Snippet;
		/** The document's h2s, which the contents rail walks. Under two, there's no rail. */
		headings?: DocHeading[];
		/** The rail's name: "On this page". */
		contentsLabel: string;
		/** Supplied by a document that lives in a frame; the default reads the DOM by id. */
		locate?: LocateHeading;
		/** Changes when the page is swapped without navigation, so the pane returns to the top. */
		resetKey?: string;
		/** The reading column's width. `wide` is for a document that brings tables and boards. */
		measure?: "prose" | "wide";
		/** The scroll box, for a document that has to place things inside it. */
		scroller?: HTMLElement | null;
		children: Snippet;
	}

	// =========================
	// PROPS
	// =========================
	let {
		title,
		summary,
		icon: Icon,
		section,
		updated,
		actions,
		headings = [],
		contentsLabel,
		locate,
		resetKey,
		measure = "prose",
		scroller = $bindable(null),
		children,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	const spy = new ScrollSpy();

	// DERIVED
	let hasRail = $derived(headings.length > 1);
	let meta = $derived([section, updated].filter(Boolean) as string[]);

	// =========================
	// EFFECTS
	// =========================
	$effect(() => spy.attach(scroller, headings, locate));

	$effect(() => {
		void resetKey;
		scroller?.scrollTo({ top: 0 });
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<!-- The anatomy, once: header, then the reading column with its contents rail.
     A surface supplies content and never lays this out, so two pages can't
     arrive with different layouts. The pane is its own container, since the
     room left after the map is what decides the rail, not the window. -->
<div
	bind:this={scroller}
	class="doc-page @container/page thin-scrollbar relative min-h-0 flex-1 overflow-y-auto"
>
	{#if hasRail}
		<!-- Below the rail's width the contents sit on a strip that stays put. -->
		<div class="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur @3xl/page:hidden">
			<OnThisPage
				variant="bar"
				items={headings}
				active={spy.active}
				label={contentsLabel}
				onselect={(id) => spy.jump(id)}
			/>
		</div>
	{/if}

	<div
		class="mx-auto flex w-full gap-10 px-5 @2xl/page:px-8 {measure === 'wide'
			? 'max-w-[84rem]'
			: 'max-w-[68rem]'}"
	>
		<article class="min-w-0 flex-1 pb-20 pt-8 @2xl/page:pt-10">
			<header class="mb-8 border-b border-border pb-6">
				<div class="flex items-start gap-4">
					{#if Icon}
						<span
							class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand dark:bg-brand-800/30 dark:text-brand-light"
						>
							<Icon class="size-5" weight="bold" />
						</span>
					{/if}
					<div class="min-w-0 flex-1">
						<h1
							class="font-heading text-2xl font-semibold leading-tight tracking-tight text-balance text-foreground @2xl/page:text-[1.75rem]"
						>
							{title}
						</h1>
						{#if summary}
							<p class="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground text-pretty">
								{summary}
							</p>
						{/if}
						{#if meta.length > 0}
							<p class="mt-3 flex flex-wrap items-center gap-x-2 text-xs tabular-nums text-muted-foreground">
								{#each meta as item, i (item)}
									{#if i > 0}<span aria-hidden="true" class="size-0.5 rounded-full bg-current opacity-50"></span>{/if}
									<span>{item}</span>
								{/each}
							</p>
						{/if}
					</div>
					{#if actions}
						<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
					{/if}
				</div>
			</header>

			{@render children()}
		</article>

		{#if hasRail}
			<!-- `self-start`, since a sticky child only travels inside its own box. -->
			<aside class="hidden w-48 shrink-0 self-start pt-10 @3xl/page:sticky @3xl/page:top-0 @3xl/page:block">
				<OnThisPage
					items={headings}
					active={spy.active}
					label={contentsLabel}
					onselect={(id) => spy.jump(id)}
				/>
			</aside>
		{/if}
	</div>
</div>

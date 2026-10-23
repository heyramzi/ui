<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { tick } from "svelte";
	import { CaretDown, List } from "phosphor-svelte";
	import type { DocHeading } from "#src/components/docs/scroll-spy.svelte.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		items: DocHeading[];
		/** The id the reader is in. */
		active: string;
		/** What the rail is called: "On this page". Passed in so the library holds no copy. */
		label: string;
		onselect: (id: string) => void;
		/**
		 * `rail` sits beside the document, `bar` replaces it on a narrow pane, and `ticks` marks
		 * each heading in the gutter with a card of headings on hover or focus.
		 */
		variant?: "rail" | "bar" | "ticks";
	}

	// =========================
	// PROPS
	// =========================
	let { items, active, label, onselect, variant = "rail" }: Props = $props();

	let hovering = $state(false);
	let focusing = $state(false);
	let showCard = $derived(hovering || focusing);

	// =========================
	// STATE
	// =========================
	let list = $state<HTMLElement | null>(null);
	let open = $state(false);
	let marker = $state({ y: 0, h: 0, ready: false });
	// Plain, not state: the effect below writes `marker`, so it can't also read it.
	let placed = false;
	let scrollBox = $state<HTMLElement | null>(null);
	let overflowing = $state(false);

	// =========================
	// DERIVED
	// =========================
	let activeIndex = $derived(
		Math.max(
			0,
			items.findIndex((item) => item.id === active),
		),
	);
	let activeLabel = $derived(
		items.find((item) => item.id === active)?.label ?? items[0]?.label ?? "",
	);
	// How far through the document: the bar's hairline, and the number a reader
	// reads at a glance.
	let progress = $derived(items.length > 1 ? activeIndex / (items.length - 1) : 0);

	// =========================
	// EFFECTS
	// =========================
	// One marker that slides to the active row, rather than a border that blinks
	// from one row to the next.
	$effect(() => {
		void active;
		void items;
		if (variant !== "rail" || !list) return;
		overflowing = !!scrollBox && scrollBox.scrollHeight > scrollBox.clientHeight + 1;
		const row = list.querySelector<HTMLElement>("[data-current='true']");
		if (!row) return;
		const y = row.offsetTop;
		const h = row.offsetHeight;
		// First placement lands with no slide, or it would glide in from the top.
		const wasPlaced = placed;
		placed = true;
		marker = { y, h, ready: wasPlaced };
		if (!wasPlaced) return;
		// A long list scrolls inside the rail, so keep the current row in view.
		const box = list.parentElement;
		if (box && (y < box.scrollTop || y + h > box.scrollTop + box.clientHeight)) {
			box.scrollTo({ top: y - box.clientHeight / 2, behavior: "auto" });
		}
	});

	function pick(id: string) {
		open = false;
		onselect(id);
		void tick();
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === "Escape") open = false;
	}}
	onpointerdown={(event) => {
		if (!open) return;
		if (!(event.target as HTMLElement).closest("[data-otp-bar]")) open = false;
	}}
/>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if variant === "ticks"}
	<nav
		aria-label={label}
		class="otp-ticks relative"
		onpointerenter={() => (hovering = true)}
		onpointerleave={() => (hovering = false)}
		onfocusin={() => (focusing = true)}
		onfocusout={(event) => {
			if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusing = false;
		}}
	>
		<ul class="flex flex-col py-2">
			{#each items as item (item.id)}
				{@const current = item.id === active}
				<li>
					<button
						type="button"
						aria-label={item.label}
						aria-current={current ? "location" : undefined}
						onclick={() => pick(item.id)}
						class="otp-tick group/tick flex h-3.5 w-7 items-center pl-2 any-pointer-coarse:h-6"
					>
						<span
							class="block h-0.5 rounded-full transition-[width,background-color] duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] {current
								? 'w-3 bg-foreground'
								: 'w-2 bg-foreground/25 group-hover/tick:bg-foreground/60'}"
						></span>
					</button>
				</li>
			{/each}
		</ul>
		<!-- The card starts inside the nav's own box, so moving from a tick onto it never leaves
		     the hover. Rows are for the pointer; the ticks are the keyboard path. -->
		<div
			inert={!showCard}
			data-open={showCard}
			class="otp-card thin-scrollbar absolute left-full top-1/2 z-30 max-h-[min(70svh,28rem)] w-max min-w-44 max-w-64 overflow-y-auto rounded-xl bg-popover p-1.5 shadow-raised ring-1 ring-foreground/10"
		>
			{#each items as item (item.id)}
				{@const current = item.id === active}
				<button
					type="button"
					tabindex="-1"
					onclick={() => pick(item.id)}
					class="block w-full truncate rounded-md py-1 pr-3 text-left text-[13px] leading-5 transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:bg-foreground/6 {item.level ===
					3
						? 'pl-5'
						: 'pl-2'} {current
						? 'font-medium text-foreground'
						: 'text-muted-foreground hover:text-foreground'}"
				>
					{item.label}
				</button>
			{/each}
		</div>
	</nav>
{:else if variant === "rail"}
	<nav aria-label={label} class="flex max-h-[calc(100svh-8rem)] flex-col gap-3">
		<!-- Set like the map's own headings on the left, so the two rails read as one. -->
		<p class="font-heading text-xs font-semibold uppercase tracking-wider text-muted-foreground">
			{label}
		</p>
		<div
			bind:this={scrollBox}
			class="thin-scrollbar -mr-2 min-h-0 overflow-y-auto pr-2"
			class:otp-fade={overflowing}
		>
			<div bind:this={list} class="relative border-l border-border">
				<!-- The marker sits on the track's own line, so the active row reads as
				     the part of the line you're standing on. -->
				<span
					aria-hidden="true"
					class="otp-marker absolute -left-px top-0 w-0.5 rounded-full bg-brand dark:bg-brand-light"
					class:is-ready={marker.ready}
					style="transform: translateY({marker.y}px); height: {marker.h}px;"
				></span>
				<ul class="flex flex-col">
					{#each items as item (item.id)}
						{@const current = item.id === active}
						<li>
							<button
								type="button"
								data-current={current}
								aria-current={current ? "location" : undefined}
								onclick={() => pick(item.id)}
								class="otp-row block w-full py-1.5 pl-3 pr-1 text-left text-[13px] leading-snug transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] any-pointer-coarse:py-2.5 {current
									? 'font-medium text-foreground'
									: 'text-muted-foreground hover:text-foreground'}"
							>
								{item.label}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</nav>
{:else}
	<div data-otp-bar class="relative">
		<button
			type="button"
			aria-expanded={open}
			aria-label={label}
			onclick={() => (open = !open)}
			class="flex h-11 w-full items-center gap-2.5 px-4 text-left transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:bg-muted/50"
		>
			<List size={16} class="shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
			<span class="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activeLabel}</span>
			<CaretDown
				size={14}
				class="shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] {open
					? 'rotate-180'
					: ''}"
			/>
		</button>
		<!-- How far through the reader is. The only motion here, and it is the state. -->
		<span aria-hidden="true" class="absolute inset-x-0 bottom-0 h-px bg-border">
			<span
				class="otp-progress block h-full origin-left bg-brand dark:bg-brand-light"
				style="transform: scaleX({progress});"
			></span>
		</span>

		{#if open}
			<nav
				aria-label={label}
				class="thin-scrollbar absolute inset-x-2 top-full z-20 mt-1 max-h-[60svh] overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg"
			>
				<ul class="flex flex-col">
					{#each items as item (item.id)}
						{@const current = item.id === active}
						<li>
							<button
								type="button"
								aria-current={current ? "location" : undefined}
								onclick={() => pick(item.id)}
								class="block w-full rounded-lg px-3 py-2.5 text-left text-sm leading-snug transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] {current
									? 'bg-muted font-medium text-foreground'
									: 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}"
							>
								{item.label}
							</button>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
	</div>
{/if}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	.otp-marker.is-ready {
		transition:
			transform var(--duration-medium) var(--ease-smooth-out),
			height var(--duration-medium) var(--ease-smooth-out);
	}

	.otp-progress {
		transition: transform var(--duration-medium) var(--ease-smooth-out);
	}

	/* A long list fades into its edges instead of ending on a hard cut. */
	.otp-fade {
		mask-image: linear-gradient(
			to bottom,
			transparent,
			#000 0.5rem,
			#000 calc(100% - 1.5rem),
			transparent
		);
	}

	/* Opacity and a short slide, no scale: the card is anchored to a line of ticks. */
	.otp-card {
		opacity: 0;
		translate: -4px -50%;
		pointer-events: none;
		transition:
			opacity var(--duration-fast) var(--ease-smooth-out),
			translate var(--duration-fast) var(--ease-smooth-out);
	}

	.otp-card[data-open="true"] {
		opacity: 1;
		translate: 0 -50%;
		pointer-events: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.otp-marker.is-ready,
		.otp-progress,
		.otp-card {
			transition: none;
		}
	}
</style>

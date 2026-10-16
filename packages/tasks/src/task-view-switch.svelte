<script lang="ts">
	import { cn } from "./lib/cn.js";
	import type { TaskView } from "./task-types.js";

	type Props = {
		views: TaskView[];
		/** The active view id. Bindable. */
		value: string;
		onchange?: (id: string) => void;
		label?: string;
		class?: string;
	};

	let {
		views,
		value = $bindable(),
		onchange,
		label = "View",
		class: className,
	}: Props = $props();

	let track = $state<HTMLDivElement>();
	let pill = $state<{ x: number; width: number } | null>(null);
	// The pill's first position is written without a transition, or it slides in from 0.
	let placed = $state(false);

	function measure(): void {
		const button = track?.querySelector<HTMLElement>(`[data-view="${CSS.escape(value)}"]`);
		if (!button) return;
		pill = { x: button.offsetLeft, width: button.offsetWidth };
	}

	$effect(() => {
		void value;
		void views.length;
		measure();
		if (!placed) requestAnimationFrame(() => (placed = true));
	});

	$effect(() => {
		if (!track) return;
		const observer = new ResizeObserver(() => measure());
		observer.observe(track);
		return () => observer.disconnect();
	});

	function select(id: string): void {
		if (id === value) return;
		value = id;
		onchange?.(id);
	}

	function onKeyDown(e: KeyboardEvent): void {
		if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
		e.preventDefault();
		const at = views.findIndex((view) => view.id === value);
		const next = views[(at + (e.key === "ArrowRight" ? 1 : -1) + views.length) % views.length];
		select(next.id);
		track?.querySelector<HTMLElement>(`[data-view="${CSS.escape(next.id)}"]`)?.focus();
	}
</script>

<div
	bind:this={track}
	role="tablist"
	aria-label={label}
	tabindex="-1"
	onkeydown={onKeyDown}
	class={cn(
		"task-view-switch relative inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-muted/70 p-0.5 dark:bg-muted/40",
		className,
	)}
>
	{#if pill}
		<span
			aria-hidden="true"
			class="tvs-pill absolute inset-y-0.5 left-0 rounded-md bg-background shadow-sm ring-1 ring-foreground/5 dark:bg-foreground/10"
			class:tvs-pill-placed={placed}
			style:width="{pill.width}px"
			style:transform="translateX({pill.x}px)"
		></span>
	{/if}
	{#each views as view (view.id)}
		{@const active = view.id === value}
		<button
			type="button"
			role="tab"
			data-view={view.id}
			aria-selected={active}
			tabindex={active ? 0 : -1}
			onclick={() => select(view.id)}
			class={cn(
				"relative z-10 inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors duration-[var(--duration-quick,150ms)] focus-visible:ring-2 focus-visible:ring-ring/60",
				active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
			)}
		>
			{#if view.icon}
				{@const Icon = view.icon}
				<Icon size={14} class="shrink-0" />
			{/if}
			{view.label}
		</button>
	{/each}
</div>

<style>
	.tvs-pill-placed {
		transition:
			transform var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1)),
			width var(--duration-fast, 250ms) var(--ease-smooth-out, cubic-bezier(0.22, 1, 0.36, 1));
	}

	@media (prefers-reduced-motion: reduce) {
		.tvs-pill-placed {
			transition: none;
		}
	}
</style>

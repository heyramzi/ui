<script lang="ts" generics="Id extends string">
	import { tick } from "svelte";
	import StatusDot from "@heyramzi/ui/tasks/status-dot";
	import { MARKS, type Mark } from "#src/ui/marks.js";
	import Swap from "#src/ui/Swap.svelte";
	import { glide } from "#src/ui/glide.js";

	type Item = { id: Id; label: string; count?: number; mark?: Mark };
	let {
		items,
		value,
		label,
		onchange,
	}: { items: readonly Item[]; value: Id; label: string; onchange: (id: Id) => void } = $props();

	let bar = $state<HTMLElement>();
	let ready = $state(false);

	function place(move = false) {
		const host = bar;
		const current = host?.querySelector<HTMLElement>("[aria-selected='true']");
		if (!host || !current) return;
		const write = () => {
			host.style.setProperty("--px", `${current.offsetLeft}px`);
			host.style.setProperty("--pw", `${current.offsetWidth}px`);
		};
		if (move && ready) glide(host.querySelector<HTMLElement>(".pill"), write);
		else write();
	}
	// WHY: the first paint and a resize jump in place, or the pill would slide in from zero width.
	function snap() {
		ready = false;
		place();
		requestAnimationFrame(() => requestAnimationFrame(() => (ready = true)));
	}

	$effect(() => {
		void items.length;
		void tick().then(snap);
	});
	$effect(() => {
		void value;
		void tick().then(() => place(true));
	});
	$effect(() => {
		if (!bar) return;
		const observer = new ResizeObserver(snap);
		observer.observe(bar);
		return () => observer.disconnect();
	});

	function onkey(event: KeyboardEvent) {
		const at = items.findIndex((item) => item.id === value);
		const next =
			event.key === "ArrowRight"
				? at + 1
				: event.key === "ArrowLeft"
					? at - 1
					: event.key === "Home"
						? 0
						: event.key === "End"
							? items.length - 1
							: -1;
		const target = items[next];
		if (!target) return;
		event.preventDefault();
		onchange(target.id);
		void tick().then(() => bar?.querySelector<HTMLElement>("[aria-selected='true']")?.focus());
	}
</script>

<div
	class="seg"
	class:ready
	role="tablist"
	aria-label={label}
	bind:this={bar}
	onkeydown={onkey}
	tabindex="-1"
>
	<span class="pill" aria-hidden="true"></span>
	{#each items as item (item.id)}
		<button
			class="tab"
			role="tab"
			data-tab={item.id}
			aria-selected={item.id === value}
			tabindex={item.id === value ? 0 : -1}
			onclick={() => onchange(item.id)}
		>
			{#if item.mark}<StatusDot statuses={MARKS} status={item.mark} animate={false} />{/if}
			<span class="text">{item.label}</span>
			{#if item.count !== undefined}<span class="n"><Swap value={item.count} /></span>{/if}
		</button>
	{/each}
</div>

<style>
	.seg {
		position: relative;
		display: flex;
		gap: 2px;
		padding: 3px;
		border-radius: var(--radius);
		background: var(--seg-bar, var(--ground));
	}
	.pill {
		position: absolute;
		z-index: 0;
		top: 3px;
		bottom: 3px;
		left: 0;
		width: var(--pw, 0);
		translate: var(--px, 0) 0;
		border-radius: var(--radius-sm);
		background: var(--seg-pill, var(--raised));
		box-shadow: 0 0 0 1px var(--line);
		pointer-events: none;
		transform-origin: 0 0;
	}
	.tab {
		position: relative;
		z-index: 1;
		display: inline-flex;
		flex: 1 1 auto;
		align-items: center;
		justify-content: center;
		gap: 6px;
		min-height: 28px;
		padding: 0 10px;
		border-radius: var(--radius-sm);
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
		white-space: nowrap;
		transition:
			color var(--tabs-dur) var(--tabs-ease),
			transform var(--duration-micro) var(--ease-smooth-out);
	}
	.tab:hover {
		color: var(--text);
	}
	.tab:active {
		transform: scale(var(--scale-medium));
	}
	.tab[aria-selected="true"] {
		color: var(--text);
	}
	.n {
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.tab[aria-selected="true"] .n {
		color: var(--dim);
	}
	@media (pointer: coarse) {
		.tab {
			min-height: 38px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.tab {
			transition: none;
		}
	}
</style>

<script lang="ts">
	import { paceOf, rate, TARGETS, toneOf } from "#src/core/pace.js";
	import { useApp } from "#src/hooks/app.svelte.js";

	const app = useApp();
	const rows = $derived(app.review.model ? paceOf(app.review.model) : []);
	const all = $derived(rows.find((row) => row.id === "all") ?? rows[0]);
	const layoutRate = $derived(all ? rate(all.layouts, all.minutes) : 0);
	const insertRate = $derived(all ? rate(all.inserts, all.minutes) : 0);
	const lowLayouts = $derived(layoutRate < TARGETS.layouts);
	const lowInserts = $derived(insertRate < TARGETS.inserts);
	const low = $derived(lowLayouts || lowInserts);
	const label = $derived(
		lowLayouts || lowInserts ? "Pace is slow" : `Pace ${Math.round(layoutRate)} a minute`,
	);
	const detail = $derived(
		`Layout changes: ${Math.round(layoutRate)} a minute, aim for ${TARGETS.layouts}. Clips: ${Math.round(insertRate)} a minute, aim for ${TARGETS.inserts}`,
	);

	const minutes = (value: number): string =>
		value < 1 ? "under a minute" : `${Math.round(value)} min`;

	let open = $state(false);
	let wrap = $state<HTMLElement>();

	$effect(() => {
		if (!open) return;
		const away = (event: PointerEvent) => {
			if (event.target instanceof Node && !wrap?.contains(event.target)) open = false;
		};
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") open = false;
		};
		document.addEventListener("pointerdown", away);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", away);
			document.removeEventListener("keydown", onKey);
		};
	});
</script>

{#if all}
	<div class="wrap" bind:this={wrap}>
		<button
			type="button"
			class="pace tone-{low ? 'warn' : 'neutral'}"
			aria-expanded={open}
			aria-haspopup="dialog"
			aria-label="{label}. {detail}."
			title={detail}
			onclick={() => (open = !open)}
		>
			<span class="dot" aria-hidden="true"></span><span class="num">{label}</span>
		</button>
		<div class="pop" data-open={open} role="dialog" aria-label="Pace" inert={!open}>
			<ul>
				{#each rows as row (row.id)}
					{@const layouts = rate(row.layouts, row.minutes)}
					{@const inserts = rate(row.inserts, row.minutes)}
					<li class:total={row.id === "all"}>
						<span class="name">{row.label}<span class="len num">{minutes(row.minutes)}</span></span>
						<span
							class="cell tone-{toneOf(layouts, TARGETS.layouts)}"
							title="{row.layouts} layout changes in {minutes(row.minutes)}"
						>
							<span class="value num"
								>{Math.round(layouts)}<span class="of"> / {TARGETS.layouts}</span></span
							>
							<span class="meter" style:--fill="{Math.min(layouts / TARGETS.layouts, 1) * 100}%"
							></span>
							<span class="kind">Layout changes</span>
						</span>
						<span
							class="cell tone-{toneOf(inserts, TARGETS.inserts)}"
							title="{row.inserts} clips in {minutes(row.minutes)}"
						>
							<span class="value num"
								>{Math.round(inserts)}<span class="of"> / {TARGETS.inserts}</span></span
							>
							<span class="meter" style:--fill="{Math.min(inserts / TARGETS.inserts, 1) * 100}%"
							></span>
							<span class="kind">Clips</span>
						</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

<style>
	.wrap {
		position: relative;
		display: inline-flex;
		flex: none;
	}
	/* Plain text with a status dot: a bordered pill read as a button, and the pace is a reading, not an action. */
	.pace {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 28px;
		padding: 0 2px;
		border-radius: var(--radius-xs);
		background: none;
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
		text-decoration: underline dotted transparent;
		text-underline-offset: 3px;
		transition: text-decoration-color var(--duration-quick) var(--ease-smooth-out);
	}
	.pace.tone-warn {
		color: var(--warn-text);
	}
	.pace[aria-expanded="true"] {
		text-decoration-color: currentColor;
	}
	@media (hover: hover) and (pointer: fine) {
		.pace:hover {
			text-decoration-color: currentColor;
		}
	}
	.pace:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.dot {
		width: 7px;
		height: 7px;
		flex: none;
		border-radius: 50%;
		background: var(--tone);
	}
	.pop {
		position: absolute;
		z-index: 50;
		top: calc(100% + 8px);
		left: 0;
		width: min(320px, calc(100vw - 2 * var(--gutter)));
		max-height: min(70vh, 480px);
		overflow-y: auto;
		padding: 6px;
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-pop);
		transform-origin: top left;
		opacity: 0;
		visibility: hidden;
		transform: scale(var(--scale-tiny));
		transition:
			opacity var(--dropdown-close-dur) var(--ease-smooth-out),
			transform var(--dropdown-close-dur) var(--ease-smooth-out),
			visibility 0s linear var(--dropdown-close-dur);
	}
	.pop[data-open="true"] {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition:
			opacity var(--dropdown-open-dur) var(--ease-smooth-out),
			transform var(--dropdown-open-dur) var(--ease-smooth-out),
			visibility 0s;
	}
	@starting-style {
		.pop[data-open="true"] {
			opacity: 0;
			transform: scale(var(--dropdown-pre-scale));
		}
	}
	li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
		align-items: start;
		gap: 10px;
		padding: 8px;
		border-radius: var(--radius-sm);
	}
	li + li {
		border-top: 1px solid var(--line-soft);
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
	.name {
		padding-top: 1px;
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
	}
	.total .name {
		color: var(--text);
	}
	.len {
		display: block;
		margin-top: 2px;
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.cell {
		color: var(--tone);
	}
	.value {
		display: block;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.of {
		color: var(--faint);
		font-weight: 500;
	}
	.meter {
		display: block;
		height: 3px;
		margin-top: 6px;
		border-radius: var(--radius-xs);
		background:
			linear-gradient(currentColor, currentColor) 0 0 / var(--fill) 100% no-repeat,
			var(--line-soft);
	}
	.kind {
		display: block;
		margin-top: 4px;
		color: var(--faint);
		font-size: var(--fs-xs);
	}
</style>

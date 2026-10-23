<script lang="ts">
	import { tick } from "svelte";
	import { clickable, effectiveState, isClickable, passMeta, splitRail } from "#src/core/passes.js";
	import type { Pass } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import PassNode from "#src/ui/PassNode.svelte";
	import Swap from "#src/ui/Swap.svelte";
	import { glide } from "#src/ui/glide.js";

	const app = useApp();
	const model = $derived(app.review.model);
	const rail = $derived(model ? splitRail(model) : null);

	let list = $state<HTMLElement>();
	let ready = $state(false);
	const shape = $derived(model?.passes.map((pass) => pass.id).join());
	const row = () => list?.querySelector<HTMLElement>(".row[aria-current='page']");

	/** Measure the selected row and write the indicator's box; `move` glides there on transform. */
	function place(move = false) {
		const host = list;
		const current = row();
		if (!host || !current) return;
		const write = () => {
			const hostBox = host.getBoundingClientRect();
			const box = current.getBoundingClientRect();
			host.style.setProperty("--ix", `${box.left - hostBox.left}px`);
			host.style.setProperty("--iy", `${box.top - hostBox.top}px`);
			host.style.setProperty("--iw", `${box.width}px`);
			host.style.setProperty("--ih", `${box.height}px`);
		};
		if (move && ready) glide(host.querySelector<HTMLElement>(".indicator"), write);
		else write();
	}

	// WHY: first paint and any resize jump straight there. Only a change of pass tweens.
	function snap() {
		ready = false;
		place();
		requestAnimationFrame(() => requestAnimationFrame(() => (ready = true)));
	}

	$effect(() => {
		void shape;
		void tick().then(snap);
	});

	$effect(() => {
		void app.pass.selected?.id;
		void tick().then(() => {
			place(true);
			row()?.scrollIntoView({ block: "nearest", inline: "nearest" });
		});
	});

	$effect(() => {
		if (!list) return;
		const observer = new ResizeObserver(snap);
		observer.observe(list);
		return () => observer.disconnect();
	});

	// WHY: the icon strip drops the words, so each row keeps its name and state as a tooltip and a label.
	const strip = (pass: Pass): string | undefined => {
		if (!app.panels.compact) return undefined;
		const text = passMeta(pass);
		return text ? `${pass.label}, ${text}` : pass.label;
	};

	// WHY: the number is what the 1-9 keys jump to, so the collapsed strip shows it as each node's own cue.
	const order = $derived(new Map(model ? clickable(model).map((pass, i) => [pass.id, i + 1]) : []));

	const railFocused = () => !!list?.contains(document.activeElement);

	async function step(delta: number) {
		const target = app.pass.move(delta);
		if (!target) return;
		await tick();
		list?.querySelector<HTMLElement>(`[data-pass="${CSS.escape(target.id)}"]`)?.focus();
	}

	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "pass.move",
				keys: ["arrowup", "arrowdown", "arrowleft", "arrowright"],
				display: "Up / Down",
				label: "Move between steps",
				group: "Steps",
				run: (_e, combo) => {
					if (!railFocused()) return false;
					void step(combo === "arrowup" || combo === "arrowleft" ? -1 : 1);
				},
			}),
			app.keys.bind({
				id: "pass.jump",
				keys: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
				display: "1-9",
				label: "Jump to a step",
				group: "Steps",
				run: (_e, combo) => void app.pass.jump(Number(combo)),
			}),
		];
		return () => offs.forEach((off) => off());
	});
</script>

{#snippet meta(pass: Pass)}
	{@const text = passMeta(pass)}
	<span
		class="meta"
		class:warn={effectiveState(pass) === "blocked"}
		class:left={(pass.open ?? 0) > 0}
		>{#if text}<Swap value={text} />{/if}</span
	>
{/snippet}

<nav class="rail" class:strip={app.panels.compact} aria-label="Steps">
	{#if !rail}
		<div class="skeleton">
			{#each [0, 1, 2, 3, 4, 5] as i (i)}<span class="skel row-skel"></span>{/each}
		</div>
	{:else}
		{#each rail.header as pass (pass.id)}
			<div class="lead" data-pass-status={pass.id} data-tip={strip(pass)}>
				<PassNode state={effectiveState(pass)} live={false} />
				<span class="label">{pass.label}</span>
				{@render meta(pass)}
			</div>
		{/each}
		<div class="list" bind:this={list} class:ready>
			<span class="indicator" aria-hidden="true"></span>
			{#each rail.groups as { group, passes } (group.id)}
				<section class="group" aria-labelledby="rv-g-{group.id}">
					<h2 id="rv-g-{group.id}">{group.label}</h2>
					{#each passes as pass (pass.id)}
						{@const selected = app.pass.selected?.id === pass.id}
						{@const open = app.openNotes(pass.id)}
						{#if isClickable(pass)}
							<button
								class="row"
								data-pass={pass.id}
								data-tip={strip(pass)}
								aria-label={strip(pass)}
								aria-current={selected ? "page" : undefined}
								tabindex={selected ? 0 : -1}
								onclick={() => app.pass.select(pass.id)}
							>
								<PassNode state={effectiveState(pass)} />
								<span class="step num" aria-hidden="true">{order.get(pass.id)}</span>
								<span class="label">{pass.label}</span>
								{@render meta(pass)}
								{#if open > 0}<span
										class="notes num"
										aria-label="{open} {open === 1 ? 'note' : 'notes'} open"
										><Swap value={open} /></span
									>{/if}
							</button>
						{:else}
							<div class="row status" data-pass-status={pass.id} data-tip={strip(pass)}>
								<PassNode state={effectiveState(pass)} live={false} />
								<span class="label">{pass.label}</span>
								{@render meta(pass)}
							</div>
						{/if}
					{/each}
				</section>
			{/each}
		</div>
	{/if}
</nav>

<style>
	.rail {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		overflow: hidden auto;
		padding: 6px 8px 16px;
		background: var(--surface);
	}
	.lead {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 32px;
		margin: 2px 0 4px;
		padding: 0 10px;
		border-bottom: 1px solid var(--line-soft);
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.lead .label {
		flex: 1;
	}
	.list {
		position: relative;
	}
	.group {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	h2 {
		padding: 14px 10px 4px;
		color: var(--faint);
		font-size: var(--fs-xs);
		font-weight: 600;
	}
	.group:first-of-type h2 {
		padding-top: 8px;
	}
	.row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 36px;
		padding: 0 10px;
		border-radius: var(--radius-sm);
		color: var(--dim);
		font-size: var(--fs-sm);
		transition:
			color var(--duration-fast) var(--ease-smooth-out),
			background-color var(--duration-quick) var(--ease-smooth-out),
			transform var(--duration-micro) var(--ease-smooth-out);
	}
	@media (hover: hover) and (pointer: fine) {
		button.row:hover {
			background: var(--hover);
			color: var(--text);
		}
	}
	button.row:active {
		transform: scale(var(--scale-small));
	}
	button.row[aria-current="page"] {
		color: var(--text);
		background: transparent;
	}
	.row.status {
		min-height: 30px;
		color: var(--faint);
		cursor: default;
		font-size: var(--fs-xs);
	}
	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		flex: none;
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	button.row[aria-current="page"] .meta {
		color: var(--dim);
	}
	.meta.left {
		color: var(--warn-text);
	}
	button.row[aria-current="page"] .meta.left {
		color: var(--warn-text);
	}
	.meta.warn {
		color: var(--bad);
	}
	.notes {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		flex: none;
		color: var(--dim);
		font: 500 var(--fs-xs) / 1 var(--mono);
	}
	.notes::before {
		content: "";
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent);
	}
	.indicator {
		position: absolute;
		z-index: 0;
		top: 0;
		left: 0;
		width: var(--iw, 0);
		height: var(--ih, 0);
		translate: var(--ix, 0) var(--iy, 0);
		border-radius: var(--radius-sm);
		background: var(--raised);
		pointer-events: none;
		opacity: 0;
		transform-origin: 0 0;
	}
	.list:has(.row[aria-current="page"]) .indicator {
		opacity: 1;
	}
	.indicator::before {
		content: "";
		position: absolute;
		left: 0;
		top: 8px;
		bottom: 8px;
		width: 2px;
		border-radius: var(--radius-xs);
		background: var(--accent);
	}
	/* A laptop width: icons only, so the video and the notes keep their room. */
	.rail.strip {
		padding-inline: 4px;
		/* WHY: the tooltips hang off the strip's right edge, so it can't clip. */
		overflow: visible;
	}
	.step {
		display: none;
		color: var(--faint);
		font: 500 10px / 1 var(--mono);
	}
	.strip .step {
		position: absolute;
		top: 3px;
		right: 5px;
		display: block;
	}
	.strip .row[data-tip]::after,
	.strip .lead[data-tip]::after {
		top: 50%;
		left: calc(100% + 8px);
		translate: 0 -50%;
		transform-origin: left center;
		white-space: nowrap;
	}
	.strip .row[data-tip]:focus-visible {
		z-index: 40;
	}
	@media (hover: hover) and (pointer: fine) {
		.strip .row[data-tip]:hover {
			z-index: 40;
		}
	}
	.strip .label,
	.strip .meta,
	.strip .notes {
		display: none;
	}
	.strip .row,
	.strip .lead {
		justify-content: center;
		padding: 0;
	}
	.strip h2 {
		height: 1px;
		margin: 10px 12px 8px;
		padding: 0;
		overflow: hidden;
		background: var(--line-soft);
		font-size: 0;
	}
	.strip .group:first-of-type h2 {
		display: none;
	}
	.skeleton {
		display: grid;
		gap: 8px;
		padding: 12px 6px;
	}
	.row-skel {
		height: 28px;
	}
</style>

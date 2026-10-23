<script lang="ts">
	import { untrack } from "svelte";
	import { clock, clockTenths } from "#src/core/format.js";
	import type { Player } from "#src/core/types.js";
	import { END_GAP } from "#src/hooks/zoom.svelte.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import NotesLane from "#src/ui/NotesLane.svelte";
	import Ruler from "#src/ui/Ruler.svelte";
	import Waveform from "#src/ui/Waveform.svelte";

	let { player }: { player: Player } = $props();
	const app = useApp();
	const p = $derived(app.player);
	const zoom = app.zoom;
	const c = app.compose;
	const duration = $derived(p.duration || player.duration);
	const pct = (seconds: number) =>
		duration ? Math.min(Math.max(seconds / duration, 0), 1) * 100 : 0;
	const lanes = $derived(player.lanes ?? []);

	let view = $state<HTMLElement>();
	let strip = $state<HTMLElement>();
	let hover = $state<number | null>(null);
	let drag = $state.raw<{ from: number; to: number; x: number; moved: boolean } | null>(null);
	let tip = $state.raw<{ text: string; x: number; y: number } | null>(null);
	let tipEl = $state<HTMLElement>();
	let stripW = $state(0);

	// A label needs room for 3 characters and the padding; the ellipsis does the rest.
	const MIN_LABEL_PX = 28;
	// A pack name repeated on every chip says nothing, so a lane that shares one drops it.
	const prefixOf = (labels: string[]) => {
		if (labels.length < 2) return "";
		const word = labels[0]?.split(" ")[0] ?? "";
		const same = labels.every((l) => l === word || l.startsWith(`${word} `));
		return same && labels.some((l) => l !== word) ? `${word} ` : "";
	};
	const shown = (label: string | undefined, prefix: string) =>
		label?.startsWith(prefix) && label.length > prefix.length ? label.slice(prefix.length) : label;
	const fits = (from: number, to: number) => ((pct(to) - pct(from)) / 100) * stripW >= MIN_LABEL_PX;

	$effect(() => {
		if (!view || !strip) return;
		return zoom.attach({ view, strip, duration: () => duration, time: () => p.time });
	});
	// A seek from outside, or playback running off the edge, brings the playhead back in view.
	$effect(() => {
		const t = p.time;
		untrack(() => zoom.reveal(t, p.paused ? 0.15 : 0.1));
	});
	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "timeline.in",
				keys: ["=", "+"],
				label: "Zoom the timeline in",
				group: "Player",
				run: () => void zoom.in(),
			}),
			app.keys.bind({
				id: "timeline.out",
				keys: ["-"],
				label: "Zoom the timeline out",
				group: "Player",
				run: () => void zoom.out(),
			}),
			app.keys.bind({
				id: "timeline.fit",
				keys: ["0"],
				label: "Fit the whole video",
				group: "Player",
				enabled: () => zoom.level > 1,
				run: () => void zoom.fit(),
			}),
		];
		return () => offs.forEach((off) => off());
	});

	const sel = $derived.by(() => {
		if (drag?.moved)
			return { at: Math.min(drag.from, drag.to), span: Math.abs(drag.to - drag.from) };
		const t = c.open ? c.time : null;
		return t?.span ? { at: t.at, span: t.span } : null;
	});

	const timeAt = (event: PointerEvent) => {
		const box = strip?.getBoundingClientRect();
		if (!box || !duration) return 0;
		return Math.min(Math.max(((event.clientX - box.left) / box.width) * duration, 0), duration);
	};
	function down(event: PointerEvent) {
		if (event.button !== 0) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		const from = timeAt(event);
		drag = { from, to: from, x: event.clientX, moved: false };
		p.seek(from);
	}
	function move(event: PointerEvent) {
		const t = timeAt(event);
		hover = event.pointerType === "touch" && !drag ? null : t;
		const target = (event.target as HTMLElement).closest<HTMLElement>("[data-say]");
		tip =
			drag?.moved || !target
				? null
				: {
						text: target.dataset.say ?? "",
						x: event.clientX,
						y: target.getBoundingClientRect().top,
					};
		if (!drag) return;
		// Under 4px of travel it's still a click.
		if (!drag.moved && Math.abs(event.clientX - drag.x) < 4) return;
		if (!drag.moved) p.pause();
		zoom.edge(event.clientX);
		drag = { ...drag, to: t, moved: true };
		p.seek(t);
	}
	function up() {
		const done = drag;
		drag = null;
		if (!done?.moved) return;
		const span = Math.abs(done.to - done.from);
		if (span < 0.1) return;
		const at = Math.min(done.from, done.to);
		const kept = c.open ? c.time?.frame : undefined;
		p.seek(at);
		c.start({
			kind: "time",
			at: Math.round(at * 10) / 10,
			span: Math.round(span * 10) / 10,
			...(kept ? { frame: kept } : {}),
		});
		app.panels.showPanel();
	}
	function focusSpan(event: FocusEvent) {
		const el = event.currentTarget as HTMLElement;
		const box = el.getBoundingClientRect();
		tip = { text: el.dataset.say ?? "", x: box.left + box.width / 2, y: box.top };
	}
	function leave() {
		hover = null;
		tip = null;
	}
	function key(event: KeyboardEvent) {
		const step = event.shiftKey ? 5 : 1;
		if (event.key === "ArrowRight") p.seek(p.time + step);
		else if (event.key === "ArrowLeft") p.seek(p.time - step);
		else return;
		event.preventDefault();
		event.stopPropagation();
	}

	$effect(() => {
		if (!tipEl) return;
		if (tip) {
			tipEl.showPopover();
			const half = tipEl.offsetWidth / 2;
			tipEl.style.left = `${Math.min(Math.max(tip.x, half + 8), innerWidth - half - 8)}px`;
			tipEl.style.top = `${tip.y - tipEl.offsetHeight - 8}px`;
		} else if (tipEl.matches(":popover-open")) tipEl.hidePopover();
	});
</script>

<div class="tl" style:--n={lanes.length + 2}>
	<div class="heads">
		<span></span>
		{#each lanes as lane (lane.id)}<span class="gutter">{lane.label}</span>{/each}
		<span class="gutter">Audio</span>
		<span class="gutter">Notes</span>
	</div>
	<div class="view" bind:this={view}>
		<div class="content" style:width="{zoom.level * 100}%" style:padding-right="{END_GAP}px">
			<div
				class="strip"
				bind:this={strip}
				bind:clientWidth={stripW}
				role="slider"
				tabindex="0"
				aria-label="Playhead"
				aria-valuemin={0}
				aria-valuemax={Math.round(duration)}
				aria-valuenow={Math.round(p.time)}
				aria-valuetext={clockTenths(p.time)}
				onpointerdown={down}
				onpointermove={move}
				onpointerup={up}
				onpointercancel={up}
				onpointerleave={leave}
				onkeydown={key}
			>
				<Ruler {duration} railW={zoom.railW} {hover} />
				{#each lanes as lane (lane.id)}
					{@const prefix = prefixOf(lane.spans.flatMap((x) => (x.label ? [x.label] : [])))}
					<div class="lane" data-lane={lane.id}>
						{#each lane.spans as span, i (i)}
							{@const text = shown(span.label, prefix)}
							{@const hidden = !!text && !fits(span.from, span.to)}
							<!-- WHY: a chip with its label hidden is only reachable by keyboard this way. -->
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<span
								class="span"
								role={span.label ? "img" : undefined}
								aria-label={span.label ? `${lane.label}: ${span.label}` : undefined}
								tabindex={hidden ? 0 : undefined}
								data-say={span.label
									? `${lane.label}: ${span.label}, ${clock(span.from)} to ${clock(span.to)}`
									: undefined}
								style:left="{pct(span.from)}%"
								style:width="{pct(span.to) - pct(span.from)}%"
								onfocus={hidden ? focusSpan : undefined}
								onblur={hidden ? leave : undefined}>{hidden ? "" : (text ?? "")}</span
							>
						{/each}
					</div>
				{/each}
				<!-- Always drawn, like its gutter label: with no file to draw (the cut pass playing the takes), an empty lane keeps the notes lane in its row. -->
				<div class="lane" data-lane="audio">
					{#if p.waveform}<Waveform src={p.waveform} {duration} time={p.time} {zoom} />{/if}
				</div>
				<div class="lane" data-lane="notes"><NotesLane {duration} /></div>
				{#if sel}<i
						class="sel"
						style:left="{pct(sel.at)}%"
						style:width="{pct(sel.at + sel.span) - pct(sel.at)}%"
					></i>{/if}
				{#if hover !== null && !drag?.moved}<i class="hair" style:left="{pct(hover)}%"></i>{/if}
				<i class="head" style:left="{pct(p.time)}%"></i>
			</div>
		</div>
	</div>
	<span class="tip" popover="manual" bind:this={tipEl}>{tip?.text}</span>
</div>

<style>
	.tl {
		display: grid;
		grid-template-columns: 76px minmax(0, 1fr);
		gap: 8px;
	}
	.heads,
	.strip {
		display: grid;
		grid-template-rows: 14px repeat(var(--n), 22px);
		gap: 4px;
	}
	.gutter {
		overflow: hidden;
		color: var(--faint);
		font-size: var(--fs-xs);
		line-height: calc(22 / 12);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.view {
		overflow: auto hidden;
		overscroll-behavior-x: contain;
	}
	.content {
		min-width: 100%;
		box-sizing: border-box;
	}
	.strip {
		position: relative;
		cursor: ew-resize;
		touch-action: pan-y;
		user-select: none;
	}
	.strip:focus-visible {
		outline-offset: 2px;
	}
	.lane {
		position: relative;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--ground);
		box-shadow: inset 0 0 0 1px var(--line-soft);
	}
	/* WHY: pins overhang their lane by a hair, and the notes lane must show them whole. */
	.lane[data-lane="notes"] {
		overflow: visible;
	}
	.span {
		position: absolute;
		top: 2px;
		bottom: 2px;
		overflow: hidden;
		min-width: 4px;
		padding: 0 4px;
		border-radius: var(--radius-xs);
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line-strong);
		color: var(--text);
		font-size: var(--fs-xs);
		font-weight: 600;
		line-height: 1.5;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.span:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	/* WHY: this sits after the base rules, or their 22px rows and 18px line-height win. */
	@media (min-width: 901px) and (max-height: 899px) {
		.heads,
		.strip {
			grid-template-rows: 12px repeat(var(--n), 16px);
			gap: 2px;
		}
		.gutter {
			line-height: calc(16 / 12);
		}
		.span {
			top: 1px;
			bottom: 1px;
			line-height: calc(14 / 12);
		}
	}
	.sel {
		position: absolute;
		z-index: 2;
		inset-block: 0;
		border-radius: var(--radius-xs);
		background: color-mix(in oklab, var(--accent) 16%, transparent);
		box-shadow:
			inset 1px 0 0 var(--accent),
			inset -1px 0 0 var(--accent);
		pointer-events: none;
	}
	.hair {
		position: absolute;
		z-index: 2;
		inset-block: 0;
		width: 1px;
		background: var(--line-strong);
		pointer-events: none;
	}
	.head {
		position: absolute;
		z-index: 5;
		inset-block: 0;
		width: 2px;
		margin-left: -1px;
		background: var(--accent);
		box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 25%, transparent);
		pointer-events: none;
	}
	.head::before {
		content: "";
		position: absolute;
		top: -3px;
		left: -4px;
		width: 10px;
		height: 8px;
		border-radius: var(--radius-xs);
		background: var(--accent);
	}
	.tip {
		position: fixed;
		inset: auto;
		max-width: 260px;
		margin: 0;
		padding: 5px 8px;
		border: 0;
		border-radius: var(--radius-sm);
		background: var(--text);
		color: var(--ground);
		font: 500 var(--fs-xs) / 1.35 var(--sans);
		white-space: pre-line;
		pointer-events: none;
		animation: tip-in var(--tt-in-dur) var(--ease-out) both;
	}
	@keyframes tip-in {
		from {
			opacity: 0;
			scale: var(--tt-scale);
		}
	}
	@media (max-width: 760px) {
		.tl {
			grid-template-columns: 52px minmax(0, 1fr);
		}
	}
</style>

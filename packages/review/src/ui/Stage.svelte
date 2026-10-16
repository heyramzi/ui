<script lang="ts">
	import { untrack } from "svelte";
	import { guessedRenderMs, progressOf, renderEstimate } from "#src/core/draft.js";
	import { clock, clockTenths } from "#src/core/format.js";
	import { renderWords } from "#src/core/render-words.js";
	import type { Frame, Lane, Note, Player } from "#src/core/types.js";
	import { isSettled } from "#src/core/notes.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import Timeline from "#src/ui/Timeline.svelte";

	let { player }: { player: Player } = $props();
	const app = useApp();
	const p = $derived(app.player);
	const gate = $derived(app.playback.gate);
	// WHY: a review cut is a 30 fps render, so one frame is a thirtieth of a second.
	const FPS = 30;
	const zoom = app.zoom;
	const model = $derived(app.review.model);
	const duration = $derived(p.duration || player.duration);
	const pct = (seconds: number) =>
		duration ? Math.min(Math.max(seconds / duration, 0), 1) * 100 : 0;

	let frameEl = $state<HTMLElement>();
	let draft = $state.raw<Frame | undefined>();
	let origin: { x: number; y: number } | undefined;

	// --- what the player waits on: the live preview's takes in the cut pass, the preview render elsewhere ---
	const job = $derived(gate.job);
	const rendering = $derived(gate.working);
	/** The job didn't finish. The frame says why, and nothing plays on the stale one. */
	const failure = $derived(job?.state === "failed" ? gate.failed : "");
	/** The new picture hasn't drawn its first frame, so the cover stays until it has. */
	const covered = $derived(rendering || p.loading);
	/** The studio reports when a render starts and ends, not how far along it is, so the bar counts time against the last render. */
	let base = $state({ at: 0, elapsed: 0 });
	let now = $state(0);
	const elapsed = $derived(base.elapsed + Math.max(now - base.at, 0));
	/** Every word the cover says, in one place. */
	const COPY = {
		queued: (ahead: number) => renderWords.queued("video", ahead),
		loading: "Almost ready",
		working: (first: boolean, pace: "left" | "soon" | "late", seconds: number) => {
			const start = renderWords.making("video", !first);
			if (pace === "late") return `${start}, taking longer than usual`;
			if (pace === "soon") return `${start}, a few seconds left`;
			const left = seconds >= 60 ? `${Math.floor(seconds / 60)}m${seconds % 60 ? ` ${seconds % 60}s` : ""}` : `${seconds}s`;
			return `${start}, about ${left} left`;
		},
		progress: "Estimated progress",
		playTip: "Playback is back when your video is updated",
	};
	const cover = $derived.by(() => {
		// The take proxies report no progress, so the bar sweeps until they're ready.
		if (gate.say) return { queued: true, estimated: false, fraction: 0, ahead: 0, label: gate.say };
		if (job?.state === "queued")
			return { queued: true, estimated: false, fraction: 0, ahead: job.ahead, label: COPY.queued(job.ahead) };
		if (job?.state !== "rendering")
			return { queued: false, estimated: false, fraction: 1, ahead: 0, label: COPY.loading };
		if (job.progress) {
			const { fraction, words } = progressOf(job.progress);
			const start = renderWords.making("video", job.outdated);
			return { queued: false, estimated: true, fraction, ahead: 0, label: `${start}, ${words}` };
		}
		const expected = job.expectedMs ?? guessedRenderMs(duration);
		const { fraction, pace, seconds } = renderEstimate(elapsed, expected);
		return { queued: false, estimated: true, fraction, ahead: 0, label: COPY.working(!job.outdated, pace, seconds) };
	});
	/** What the cover said last, so it fades out saying the same thing. */
	let said = $state.raw(untrack(() => cover));
	$effect(() => {
		if (covered) said = cover;
	});
	$effect(() => p.lock(gate.locks));
	$effect(() => {
		if (job?.state !== "rendering") return;
		base = { at: performance.now(), elapsed: job.elapsedMs };
		now = base.at;
	});
	$effect(() => {
		if (!rendering) return;
		const tick = setInterval(() => (now = performance.now()), 250);
		return () => clearInterval(tick);
	});

	let screen = $state<HTMLElement>();
	$effect(() => {
		if (!screen) return;
		return p.mount(screen);
	});

	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "player.toggle",
				keys: ["space"],
				label: "Play or pause",
				group: "Player",
				run: () => p.toggle(),
			}),
			app.keys.bind({
				id: "player.seek",
				keys: ["arrowleft", "arrowright", "shift+arrowleft", "shift+arrowright"],
				display: "Left / Right",
				label: "Jump 1 second (Shift: 5)",
				group: "Player",
				run: (_e, combo) => {
					if (app.root?.querySelector(".rail")?.contains(document.activeElement)) return false;
					const step = combo.startsWith("shift") ? 5 : 1;
					p.seek(p.time + (combo.endsWith("right") ? step : -step));
				},
			}),
			app.keys.bind({
				id: "player.nudge",
				keys: [",", "."],
				display: ", / .",
				label: "Step 1 frame",
				group: "Player",
				run: (_e, combo) => {
					p.pause();
					p.seek(p.time + (combo === "." ? 1 : -1) / FPS);
				},
			}),
			app.keys.bind({
				id: "player.unpin",
				keys: ["escape"],
				label: "Cancel the pin",
				group: "Player",
				enabled: () => app.pinning,
				run: () => void (app.pinning = false),
			}),
			app.keys.bind({
				id: "player.frame",
				keys: ["f"],
				label: "Pin to the frame",
				group: "Player",
				run: () => void (app.pinning = !app.pinning),
			}),
		];
		return () => offs.forEach((off) => off());
	});

	// --- pinning a point or an area on the frame ---
	const unit = (event: PointerEvent) => {
		const box = frameEl?.getBoundingClientRect();
		if (!box || box.width === 0 || box.height === 0) return { x: 0, y: 0 };
		return {
			x: Math.min(Math.max((event.clientX - box.left) / box.width, 0), 1),
			y: Math.min(Math.max((event.clientY - box.top) / box.height, 0), 1),
		};
	};
	const round = (n: number) => Number(n.toFixed(3));
	function down(event: PointerEvent) {
		if (!app.pinning || covered) return;
		origin = unit(event);
		draft = { x: round(origin.x), y: round(origin.y) };
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
	}
	function move(event: PointerEvent) {
		if (!origin) return;
		const at = unit(event);
		const x = Math.min(origin.x, at.x);
		const y = Math.min(origin.y, at.y);
		const w = Math.abs(at.x - origin.x);
		const h = Math.abs(at.y - origin.y);
		draft =
			w > 0.02 && h > 0.02
				? { x: round(x), y: round(y), w: round(w), h: round(h) }
				: { x: round(origin.x), y: round(origin.y) };
	}
	function up() {
		if (!origin || !draft) return;
		origin = undefined;
		p.pause();
		// A spot joins the moment or section already being noted while the playhead is still inside it.
		const now = Math.round(p.time * 10) / 10;
		const cur = app.compose.open ? app.compose.time : null;
		const inside = cur && p.time >= cur.at - 0.05 && p.time <= cur.at + (cur.span ?? 0) + 0.05;
		app.compose.start(inside ? { ...cur, frame: draft } : { kind: "time", at: now, frame: draft });
		app.panels.showPanel();
		draft = undefined;
		app.pinning = false;
	}

	/** Frames of notes near the playhead, so a pin shows where it was made. */
	const boxes = $derived.by(() => {
		const now = p.time;
		const out: { id: string; frame: Frame; active: boolean }[] = [];
		for (const note of model?.notes ?? []) {
			const t = note.target;
			if (t.kind !== "time" || !t.frame || isSettled(note)) continue;
			if (now >= t.at - 0.3 && now <= t.at + Math.max(t.span ?? 0, 0.9))
				out.push({ id: note.id, frame: t.frame, active: app.activeNote === note.id });
		}
		const pin = app.compose.target;
		if (app.compose.open && pin.kind === "time" && pin.frame)
			out.push({ id: "pending", frame: pin.frame, active: true });
		return out;
	});
</script>

<section class="stage" aria-label="Video">
	<div class="viewer">
		<div class="fit">
		<div
			class="frame"
			class:pinning={app.pinning}
			style:--ratio={p.ratio}
			bind:this={frameEl}
			role="presentation"
			onpointerdown={down}
			onpointermove={move}
			onpointerup={up}
			onpointercancel={up}
		>
			<!-- The space key plays and pauses, so the click is a pointer shortcut. -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				class="screen"
				bind:this={screen}
				role="presentation"
				onclick={() => !app.pinning && p.toggle()}
			></div>
			{#each boxes as box (box.id)}
				<i
					class="mark"
					class:area={box.frame.w !== undefined}
					class:active={box.active}
					style:left="{box.frame.x * 100}%"
					style:top="{box.frame.y * 100}%"
					style:width={box.frame.w !== undefined ? `${box.frame.w * 100}%` : undefined}
					style:height={box.frame.h !== undefined ? `${box.frame.h * 100}%` : undefined}
				></i>
			{/each}
			{#if draft}
				<i
					class="mark active"
					class:area={draft.w !== undefined}
					style:left="{draft.x * 100}%"
					style:top="{draft.y * 100}%"
					style:width={draft.w !== undefined ? `${draft.w * 100}%` : undefined}
					style:height={draft.h !== undefined ? `${draft.h * 100}%` : undefined}
				></i>
			{/if}
			{#if app.pinning}<span class="hint">Click a spot or drag an area</span>{/if}
			<div class="rerender" class:on={failure !== "" && !covered} inert={failure === "" || covered} role="status">
				<div class="band">
					<p class="say">{failure}</p>
				</div>
			</div>
			<div class="rerender" class:on={covered} inert={!covered} role="status">
				<div class="band">
				<p class="say">{said.label}</p>
				{#if said.queued && said.ahead > 0}
					<!-- While waiting the bar is the line: one mark per video, the one rendering now pulses, yours is last. -->
					<ol class="line-up" aria-hidden="true">
						{#each { length: said.ahead + 1 }, i (i)}
							<li class:now={i === 0} class:mine={i === said.ahead}></li>
						{/each}
					</ol>
				{:else}
					<div
						class="bar-est"
						class:sweep={said.queued && !said.estimated}
						role="progressbar"
						aria-label={COPY.progress}
						aria-valuemin="0"
						aria-valuemax="100"
						aria-valuenow={said.queued ? undefined : Math.round(said.fraction * 100)}
						aria-valuetext={said.label}
					>
						<span class="fill" style:--p={said.queued ? 0 : said.fraction}></span>
					</div>
				{/if}
				</div>
			</div>
		</div>
		</div>
		<!-- The clock and the tools take equal columns, so play sits on the video's centre line. -->
		<div class="bar">
			<span class="clock num"
				>{clockTenths(p.time)}<span class="of">{" / "}{clock(duration)}</span></span
			>
			<div class="transport">
				<button
					class="btn icon"
					aria-label="Back 5 seconds"
					data-tip="Back 5s (Shift ←)"
					onclick={() => p.seek(p.time - 5)}><Icon name="skip-back" small /></button
				>
				<button
					class="play"
					aria-label={p.paused ? "Play" : "Pause"}
					data-tip={p.locked ? COPY.playTip : p.paused ? "Play (Space)" : "Pause (Space)"}
					disabled={p.locked}
					onclick={() => p.toggle()}><Icon name={p.paused ? "play" : "pause"} /></button
				>
				<button
					class="btn icon"
					aria-label="Forward 5 seconds"
					data-tip="Forward 5s (Shift →)"
					onclick={() => p.seek(p.time + 5)}><Icon name="skip-fwd" small /></button
				>
			</div>
			<div class="tools">
				<div class="zoom" role="group" aria-label="Zoom the timeline">
					<button
						class="btn icon"
						aria-label="Zoom out"
						data-tip="Zoom out (-)"
						disabled={zoom.level === 1}
						onclick={() => zoom.out()}><Icon name="minus" small /></button
					>
					{#if zoom.level > 1}<button
							class="btn level num"
							aria-label="Fit the whole video"
							data-tip="Fit (0)"
							onclick={() => zoom.fit()}>{zoom.level.toFixed(1)}x</button
						>{/if}
					<button
						class="btn icon"
						aria-label="Zoom in"
						data-tip="Zoom in (=)"
						disabled={!zoom.canZoomIn}
						onclick={() => zoom.in()}><Icon name="plus" small /></button
					>
				</div>
				<button
					class="btn icon pin"
					aria-label="Pin a note to the frame"
					aria-pressed={app.pinning}
					data-tip="Pin to frame (F)"
					onclick={() => (app.pinning = !app.pinning)}><Icon name="frame" small /></button
				>
			</div>
		</div>
		<input
			class="scrub"
			type="range"
			min="0"
			max={duration || 1}
			step="0.1"
			value={p.time}
			aria-label="Position in the video"
			aria-valuetext="{clock(p.time)} of {clock(duration)}"
			oninput={(e) => p.seek(Number(e.currentTarget.value))}
		/>
	</div>

	<div class="track">
		<Timeline {player} />
	</div>
</section>

<style>
	.stage {
		display: grid;
		gap: 10px;
		padding: 14px var(--gutter) 12px;
		border-bottom: 1px solid var(--line-soft);
		background: var(--surface);
	}
	.viewer {
		display: grid;
		justify-items: center;
		gap: 8px;
	}
	.fit {
		display: grid;
		justify-items: center;
		width: 100%;
	}
	/* The largest frame of the cut's shape that fits: a 0.2 draft fills it the same as the master. */
	.frame {
		position: relative;
		display: grid;
		width: min(100%, calc(min(46vh, 480px) * var(--ratio)));
		aspect-ratio: var(--ratio);
		border-radius: var(--radius);
		background: var(--ground);
		box-shadow: 0 0 0 1px var(--line);
		overflow: hidden;
		touch-action: none;
	}
	.frame.pinning {
		cursor: crosshair;
		box-shadow: 0 0 0 2px var(--accent);
	}
	.screen {
		display: grid;
		width: 100%;
		height: 100%;
	}
	.screen :global(video) {
		display: block;
		width: 100%;
		height: 100%;
		background: var(--ground);
	}
	/* Text and bar sit on the frame's bottom edge, queued or working, so the cover doesn't move when the update starts. The face stays readable above it. */
	.rerender {
		position: absolute;
		inset: 0;
		z-index: 2;
		display: grid;
		align-content: end;
		/* The same scrim as a card on the shelf: dark at the bottom edge, gone by the middle, so the picture stays whole above the words. */
		background: linear-gradient(
			to top,
			var(--cover-scrim-low) 0,
			var(--cover-scrim-low) 18%,
			transparent 55%
		);
		color: var(--cover-text);
		opacity: 0;
		visibility: hidden;
		transition:
			opacity var(--duration-fast) var(--ease-smooth-out),
			visibility 0s linear var(--duration-fast);
	}
	.rerender.on {
		opacity: 1;
		visibility: visible;
		transition-delay: 0s;
	}
	/* The words sit straight on the scrim, no band behind them, which drew a hard strip across the frame. */
	.band {
		display: grid;
		gap: 10px;
		padding: 12px 16px 14px;
	}
	.say {
		margin: 0;
		font-size: var(--fs-md);
		font-weight: 500;
		line-height: 1.35;
		font-variant-numeric: tabular-nums;
		text-wrap: balance;
	}
	.bar-est {
		position: relative;
		height: 4px;
		border-radius: var(--radius-pill);
		background: var(--cover-track);
		overflow: hidden;
	}
	.fill {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--cover-fill);
		transform: scaleX(var(--p));
		transform-origin: left;
		transition: transform var(--duration-medium) var(--ease-linear);
	}
	/* Queued with no estimate yet: a short segment sweeps the empty track. Once a time shows, the bar holds still. */
	.sweep .fill {
		width: 36%;
		transform: none;
		transition: none;
		animation: rv-render-sweep calc(var(--pulse-dur) * 2.4) var(--ease-in-out) infinite;
	}
	@keyframes rv-render-sweep {
		from {
			translate: -100% 0;
		}
		to {
			translate: 280% 0;
		}
	}
	.line-up {
		display: flex;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.line-up li {
		flex: 1;
		height: 4px;
		border-radius: var(--radius-pill);
		background: var(--cover-track);
	}
	.line-up .now {
		background: var(--cover-fill);
		animation: rv-line-now calc(var(--pulse-dur) * 2) var(--ease-in-out) infinite alternate;
	}
	.line-up .mine {
		background: var(--cover-text);
	}
	@keyframes rv-line-now {
		to {
			opacity: 0.4;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.line-up .now {
			animation: none;
		}
		.fill {
			transition: none;
		}
		.sweep .fill {
			animation: none;
			width: 0;
		}
	}
	.mark {
		position: absolute;
		width: 14px;
		height: 14px;
		translate: -50% -50%;
		border: 2px solid var(--warn);
		border-radius: 50%;
		background: color-mix(in oklab, var(--warn) 30%, transparent);
		pointer-events: none;
		transition: opacity var(--duration-quick) var(--ease-smooth-out);
	}
	.mark.area {
		translate: 0 0;
		border-radius: var(--radius-xs);
	}
	.mark.active {
		border-color: var(--accent);
		background: color-mix(in oklab, var(--accent) 24%, transparent);
	}
	.hint {
		position: absolute;
		inset: auto 0 10px;
		justify-self: center;
		margin: 0 auto;
		width: max-content;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		background: var(--accent);
		color: var(--on-accent);
		font-size: var(--fs-xs);
		font-weight: 600;
		pointer-events: none;
	}
	.bar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 640px;
	}
	/* The bar is the viewer's last row, so a tooltip below it would spill past the edge (even at opacity 0) and add a scroll range. Open it upward over the frame. */
	.bar [data-tip]::after {
		top: auto;
		bottom: calc(100% + 8px);
		transform-origin: bottom center;
	}
	.bar [data-tip][data-tip-end]::after {
		transform-origin: bottom right;
	}
	.clock {
		color: var(--text);
		font: 500 var(--fs-xs) / 1 var(--mono);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.transport {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.play {
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		padding: 0;
		border: 0;
		border-radius: 50%;
		background: var(--text);
		color: var(--ground);
		cursor: pointer;
		transition:
			background var(--duration-quick) var(--ease-smooth-out),
			transform var(--duration-quick) var(--ease-smooth-out);
	}
	.play:hover:not(:disabled) {
		background: color-mix(in oklch, var(--text) 85%, var(--ground));
	}
	.play:active:not(:disabled) {
		transform: scale(0.92);
	}
	/* Locked while the preview updates: a quiet ring instead of the solid disc, and no pointer. */
	.play:disabled {
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--faint);
		cursor: not-allowed;
	}
	.play:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.play :global(.ic) {
		width: 18px;
		height: 18px;
	}
	.tools {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 2px;
	}
	.zoom {
		display: flex;
		align-items: center;
	}
	.bar .pin[aria-pressed="true"] {
		color: var(--accent);
		background: color-mix(in oklab, var(--accent) 16%, transparent);
	}
	.level {
		padding: 0 6px;
		font: 500 var(--fs-xs) / 1 var(--mono);
	}
	.of {
		color: var(--faint);
	}
	.track {
		min-width: 0;
	}
	.scrub {
		display: none;
	}
	/* A laptop screen is short: a smaller frame and a tighter strip leave the work pane 300px or more. */
	@media (min-width: 901px) and (max-height: 899px) {
		.stage {
			gap: 6px;
			padding-block: 6px 8px;
		}
		.frame {
			width: min(100%, calc(min(29vh, 480px) * var(--ratio)));
		}
	}
	/* A phone pins the video at a fixed height, so the sheets under it can start at a known edge. The timeline gives way to a scrubber. */
	@media (max-width: 900px) {
		.stage {
			box-sizing: border-box;
			height: var(--stage-h);
			align-content: start;
			gap: 0;
			padding: 8px var(--gutter) 4px;
			overflow: hidden;
		}
		.viewer {
			gap: 4px;
		}
		.fit {
			align-items: center;
			height: var(--frame-h);
		}
		.frame {
			width: min(100%, calc(var(--frame-h) * var(--ratio)));
			max-height: var(--frame-h);
		}
		.track,
		.zoom {
			display: none;
		}
		.bar {
			gap: 8px;
		}
		.bar :global(.btn.icon) {
			min-width: 44px;
			min-height: 44px;
		}
		.play {
			width: 44px;
			height: 44px;
		}
		.scrub {
			display: block;
			width: 100%;
			height: 24px;
			margin: 0;
			accent-color: var(--accent);
			touch-action: pan-y;
		}
	}
	/* Beside the pass (Main's .side): the viewer takes the right column, the timeline the full width. */
	@container main (min-width: 700px) {
		:global(.side) > .stage {
			display: contents;
		}
		:global(.side) .viewer {
			grid-area: viewer;
			grid-template-rows: minmax(0, 1fr) auto;
			min-width: 0;
			min-height: 0;
			padding: 18px var(--gutter) 14px;
			background: var(--ground);
			/* Clip, never scroll: the tooltips open upward, so nothing hangs below the bar to make a scrollbar. */
			overflow: clip;
		}
		/* The frame fills the room the viewer leaves above the bar, so the bar never covers it. */
		:global(.side) .fit {
			container-type: size;
			min-height: 0;
			align-items: center;
		}
		:global(.side) .frame {
			width: min(100cqw, calc(100cqh * var(--ratio)));
		}
		:global(.side) .bar {
			max-width: 420px;
		}
		:global(.side) .track {
			grid-area: track;
			padding: 12px var(--gutter);
			border-top: 1px solid var(--line-soft);
			background: var(--surface);
		}
	}
</style>

<script lang="ts">
	import { beatsOf, kindOf } from "#src/core/beats.js";
	import { clockToSeconds, plural } from "#src/core/format.js";
	import { isSettled } from "#src/core/notes.js";
	import type {
		Beat,
		LineMark,
		Note,
		Paragraph,
		Pass,
		SpeechGap,
		TranscriptLens,
		TranscriptLine,
	} from "#src/core/types.js";
	import { timedWords, wordAt, wordClock, wordKey, wordStart } from "#src/core/words.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import BeatCard from "#src/ui/BeatCard.svelte";
	import Chapters from "#src/ui/Chapters.svelte";
	import Empty from "#src/ui/Empty.svelte";
	import Icon from "#src/components/icons/Icon.svelte";
	import PassHead from "#src/ui/PassHead.svelte";
	import SpeechGapView from "#src/ui/SpeechGap.svelte";

	let { pass }: { pass: Pass } = $props();
	const app = useApp();
	const model = $derived(app.review.model);
	const allParagraphs = $derived(model?.paragraphs ?? []);
	const removedCount = $derived(
		allParagraphs.flatMap((p) => p.lines).filter((line) => line.marks?.includes("cut")).length,
	);
	const paragraphs = $derived(
		allParagraphs
			.map((paragraph) => ({
				...paragraph,
				lines: paragraph.lines.filter(
					(line) => app.showRemovedText || !line.marks?.includes("cut"),
				),
			}))
			.filter((paragraph) => paragraph.lines.length > 0),
	);
	let scroller = $state<HTMLElement>();

	/** A paragraph's lines in runs, with a speech gap between the run before it and the run after. */
	type Segment = { lines: { line: TranscriptLine; li: number }[]; gap?: SpeechGap };

	/** Whether a line plays before the gap. A gap in a cut stretch sits on the next kept line, so it comes first. */
	const playsBefore = (line: TranscriptLine, gap: SpeechGap): boolean =>
		!line.marks?.includes("cut") &&
		(gap.cut ? line.seconds < gap.seconds : line.seconds <= gap.seconds);

	/** Each gap goes in the last paragraph that has started by its time, after the lines that play before it. */
	const segments = $derived.by(() => {
		const gaps = [...(model?.speechGaps ?? [])].sort((a, b) => a.seconds - b.seconds);
		const startOf = (para: Paragraph) =>
			(para.lines.find((line) => !line.marks?.includes("cut")) ?? para.lines[0])?.seconds ?? 0;
		const host = (gap: SpeechGap) =>
			Math.max(0, paragraphs.findLastIndex((para) => startOf(para) <= gap.seconds));
		return paragraphs.map((para, pi): Segment[] => {
			const mine = gaps.filter((gap) => host(gap) === pi);
			const out: Segment[] = [];
			let from = 0;
			for (const gap of mine) {
				const upTo = Math.max(from, para.lines.findLastIndex((line) => playsBefore(line, gap)) + 1);
				out.push({ lines: para.lines.slice(from, upTo).map((line, n) => ({ line, li: from + n })) });
				out.push({ lines: [], gap });
				from = upTo;
			}
			out.push({ lines: para.lines.slice(from).map((line, n) => ({ line, li: from + n })) });
			return out.filter((seg) => seg.gap || seg.lines.length);
		});
	});

	const LENS: Record<TranscriptLens, readonly LineMark[]> = {
		read: ["cut", "moved", "pause"],
		cut: ["cut"],
		moved: ["moved"],
		pace: ["pause"],
	};
	const MARK_WORDS: Record<LineMark, [string, string]> = {
		cut: ["cut", "cuts"],
		moved: ["moved", "moved"],
		pause: ["pause", "pauses"],
	};
	const lens = $derived(pass.lens ?? "read");
	const visible = $derived(LENS[lens]);
	const marksOf = (line: TranscriptLine) =>
		(line.marks ?? []).filter((mark) => mark === "cut" || visible.includes(mark));

	const counts = $derived(
		visible.map((mark) => ({
			mark,
			n: paragraphs.flatMap((p) => p.lines).filter((line) => line.marks?.includes(mark)).length,
		})),
	);

	type Pin = { beat: Beat; word: number };
	/** A line's text cut where its pins sit: each piece's pins come before its words, and `from` is its first word's place in the line. */
	type Piece = { pins: Beat[]; text: string; from: number };

	/** Beat pins sit before the word they start on: the last word that starts at or before them. */
	const pins = $derived.by(() => {
		const map = new Map<string, Pin[]>();
		if (!model) return map;
		const flat = paragraphs.flatMap((p, pi) =>
			p.lines.flatMap((line, li) =>
				line.marks?.includes("cut") ? [] : [{ key: `${pi}:${li}`, line }],
			),
		);
		for (const beat of beatsOf(model, pass)) {
			const host = flat.findLast((entry) => entry.line.seconds <= beat.seconds) ?? flat[0];
			if (!host) continue;
			const starts = timedWords(host.line) ? (host.line.wordSeconds ?? []) : [];
			const word = starts.length
				? Math.max(0, starts.findLastIndex((at) => at <= beat.seconds))
				: Infinity;
			map.set(host.key, [...(map.get(host.key) ?? []), { beat, word }]);
		}
		return map;
	});

	const pinsAt = (pi: number, li: number): Beat[] =>
		(pins.get(`${pi}:${li}`) ?? []).map((pin) => pin.beat);

	function piecesOf(line: TranscriptLine, at: Pin[]): Piece[] {
		const words = timedWords(line);
		if (!words || !at.length)
			return [{ pins: [], text: line.text, from: 0 }, { pins: at.map((p) => p.beat), text: "", from: 0 }];
		const pieces: Piece[] = [];
		words.forEach((word, i) => {
			const here = at.filter((pin) => pin.word === i).map((pin) => pin.beat);
			const last = pieces.at(-1);
			if (!last || here.length) pieces.push({ pins: here, text: word, from: i });
			else last.text += ` ${word}`;
		});
		return pieces;
	}

	let expanded = $state<string[]>([]);
	const toggle = (id: string) => {
		expanded = expanded.includes(id) ? expanded.filter((item) => item !== id) : [...expanded, id];
		app.beatId = id;
	};

	/** Hovering a pin floats its beat card, delayed both ways so a pass-over does nothing and the pointer can cross into the card. */
	// WHY: 220ms, not a tooltip's 80ms, because opening starts a video; the close grace only has to
	// cover the 8px gap between pin and card.
	const OPEN_MS = 220;
	const CLOSE_MS = 150;
	let peekId = $state<string | null>(null);
	let peekEl = $state<HTMLElement>();
	let peekSide = $state<"above" | "below">("above");
	let anchor: HTMLElement | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;
	// WHY: the card keeps its last beat after closing, so it fades out with its content, not empty.
	let shownId = $state<string | null>(null);
	const shownBeat = $derived(
		shownId && model ? beatsOf(model, pass).find((beat) => beat.id === shownId) : undefined,
	);
	const peekBeat = $derived(peekId === shownId ? shownBeat : undefined);

	function peekSoon(id: string, target: HTMLElement) {
		clearTimeout(timer);
		if (expanded.includes(id)) return;
		timer = setTimeout(
			() => {
				anchor = target;
				peekId = shownId = id;
				// The peeked beat becomes current, so Y, N and U act on the motion under the pointer.
				app.beatId = id;
			},
			peekId ? 0 : OPEN_MS,
		);
	}
	function holdPeek() {
		clearTimeout(timer);
	}
	function unpeekSoon() {
		clearTimeout(timer);
		timer = setTimeout(() => (peekId = null), CLOSE_MS);
	}
	function unpeek() {
		clearTimeout(timer);
		peekId = null;
	}

	// WHY: the card takes the side of the pin with more room and scrolls inside itself, because off screen puts Keep and Skip out of reach.
	function place() {
		if (!anchor || !peekEl) return;
		const GAP = 8;
		const box = anchor.getBoundingClientRect();
		const width = peekEl.offsetWidth;
		const roomAbove = box.top - GAP * 2;
		const roomBelow = innerHeight - box.bottom - GAP * 2;
		peekEl.style.maxHeight = "";
		const height = peekEl.offsetHeight;
		const side = height <= roomAbove || roomAbove > roomBelow ? "above" : "below";
		const room = side === "above" ? roomAbove : roomBelow;
		peekEl.style.maxHeight = `${room}px`;
		const shown = Math.min(height, room);
		const left = Math.min(
			Math.max(box.left + box.width / 2 - width / 2, GAP),
			innerWidth - width - GAP,
		);
		peekEl.style.left = `${left}px`;
		peekEl.style.top = `${side === "above" ? box.top - GAP - shown : box.bottom + GAP}px`;
		peekEl.style.transformOrigin = `${box.left + box.width / 2 - left}px ${side === "above" ? "100%" : "0"}`;
		peekSide = side;
	}
	$effect(() => {
		if (!peekEl) return;
		if (peekBeat) {
			if (!peekEl.matches(":popover-open")) peekEl.showPopover();
			place();
		} else if (peekEl.matches(":popover-open")) peekEl.hidePopover();
	});
	$effect(() => {
		if (!peekBeat) return;
		const onScroll = (event: Event) => {
			if (!peekEl?.contains(event.target as Node)) unpeek();
		};
		const onKey = (event: KeyboardEvent) => event.key === "Escape" && unpeek();
		document.addEventListener("scroll", onScroll, true);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("scroll", onScroll, true);
			document.removeEventListener("keydown", onKey);
		};
	});
	$effect(() => () => clearTimeout(timer));

	/** The word under the playhead, lit while the cut plays and where a click lands it. */
	const clock = $derived(wordClock(paragraphs));
	const now = $derived(model?.player ? wordAt(clock, app.player.time) : undefined);
	const seekable = $derived(!!model?.player && app.player.ready);

	/** A plain click on a word moves the playhead to it. A drag or a modified click is a selection, so it doesn't. */
	function seekToWord(event: MouseEvent, line: TranscriptLine) {
		if (!seekable || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
		if (!document.getSelection()?.isCollapsed) return;
		const word = (event.target as Element).closest<HTMLElement>("[data-w]");
		if (word) app.player.seek(wordStart(line, Number(word.dataset.w)));
	}

	/** Open text notes, and the line labels each one spans. */
	const textNotes = $derived.by(() =>
		(model?.notes ?? []).filter(
			(
				note,
			): note is Note & { target: { kind: "text"; from: string; to: string; quote: string } } =>
				note.target.kind === "text" && !isSettled(note),
		),
	);
	const noteAt = (line: TranscriptLine): Note | undefined =>
		textNotes.find(
			(note) =>
				line.seconds >= clockToSeconds(note.target.from) &&
				line.seconds <= clockToSeconds(note.target.to),
		);
</script>

<section
	class="transcript"
	id="transcript-read"
	data-view="transcript"
	data-lens={lens}
	class:seekable
	bind:this={scroller}
>
	<PassHead {pass}>
		{#if allParagraphs.length > 0}<button
			type="button"
			class="btn transcript-toggle"
			aria-pressed={app.showRemovedText}
			aria-controls="transcript-read"
			disabled={removedCount === 0}
			title={removedCount === 0 ? "No removed text in this transcript." : undefined}
			onclick={() => (app.showRemovedText = !app.showRemovedText)}
			>{app.showRemovedText ? "Hide removed text" : "Show removed text"}</button
		>{/if}
		{#if counts.some((c) => c.n > 0)}
			<ul class="legend" aria-label="What this step changed">
				{#each counts.filter((c) => c.n > 0) as { mark, n } (mark)}
					<li class="key m-{mark}"><i></i>{n} {MARK_WORDS[mark][n === 1 ? 0 : 1]}</li>
				{/each}
			</ul>
		{/if}
	</PassHead>

	<Chapters {paragraphs} host={scroller} />

	{#if paragraphs.length === 0}
		{#if removedCount > 0}
			<Empty
				icon="quote"
				title="No spoken text remains"
				hint="Show removed text to read what was cut."
			/>
		{:else}
			<!-- WHY: an empty pass is a dead end unless it says what comes next, so it offers the two moves that exist: look at the source, or load again. -->
			<Empty
				large
				icon="quote"
				title="This video has no transcript yet"
				hint={model?.descript
					? "Descript hasn't sent any words for it. Open the project to check, then load again."
					: "Ask your agent to transcribe it, then load again."}
			>
				{#if model?.descript}
					<a class="btn solid" href={model.descript.web} target="_blank" rel="noreferrer"
						>Open in Descript</a
					>
				{/if}
				<button class="btn solid" onclick={() => void app.review.refresh()}>Load again</button>
			</Empty>
		{/if}
	{:else}
		<div class="read">
			{#each paragraphs as para, pi (pi)}
				{@const open = para.lines
					.flatMap((_, n) => pinsAt(pi, n))
					.filter((beat) => expanded.includes(beat.id))}
				<div class="para" data-chapter={para.chapter ? pi : undefined}>
					{#if para.chapter}<h2 class="ch">{para.chapter}</h2>{/if}
					{#each segments[pi] ?? [] as seg, si (si)}
					{#if seg.gap}
						<div class="row"><span class="at"></span><SpeechGapView gap={seg.gap} /></div>
					{:else}
					<div class="row">
						<span class="at num">{si === 0 ? para.at : ""}</span>
						<p class="text">
							{#each seg.lines as { line, li } (li)}
								{@const marks = marksOf(line)}
								{@const note = noteAt(line)}
								{#each piecesOf(line, pins.get(`${pi}:${li}`) ?? []) as piece, pc (pc)}{#each piece.pins as beat (beat.id)}{@const kind = model
										? kindOf(model, beat.kind)
										: undefined}<button
										class="pin tone-{kind?.tone ?? 'neutral'} p-{beat.state}"
										class:on={expanded.includes(beat.id)}
										aria-expanded={expanded.includes(beat.id)}
										class:peeking={peekId === beat.id}
										data-pin={beat.id}
										aria-label="{kind?.label ?? beat.kind} at {beat.at}"
										onpointerenter={(event) => peekSoon(beat.id, event.currentTarget)}
										onpointerleave={unpeekSoon}
										onfocus={(event) => peekSoon(beat.id, event.currentTarget)}
										onblur={unpeekSoon}
										onclick={() => (unpeek(), toggle(beat.id))}
										><Icon name={kind?.icon ?? "video"} small /></button
									>{" "}{/each}{#if piece.text}<span
										class="line"
										class:m-cut={marks.includes("cut")}
										class:m-moved={marks.includes("moved")}
										class:m-pause={marks.includes("pause")}
										class:noted={!!note}
										data-line
										data-at={line.at}
										data-seconds={line.seconds}
										tabindex="-1"
										role="presentation"
										onclick={(event) => {
											if (note) ((app.activeNote = note.id), app.panels.showPanel());
											seekToWord(event, line);
										}}
										>{#each piece.text.split(" ") as word, wi (wi)}{#if wi > 0}{" "}{/if}<span
												class="w"
												class:now={now === wordKey(pi, li, piece.from + wi)}
												data-w={piece.from + wi}>{word}</span
											>{/each}</span
									>{" "}{/if}{/each}
							{/each}
						</p>
					</div>
					{/if}
					{/each}
					{#each open as beat (beat.id)}
						<BeatCard {beat} compact />
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	<div
		class="peek"
		popover="manual"
		role="dialog"
		tabindex="-1"
		data-side={peekSide}
		aria-label={shownBeat && model
			? `${kindOf(model, shownBeat.kind)?.label ?? shownBeat.kind} at ${shownBeat.at}`
			: undefined}
		bind:this={peekEl}
		onpointerenter={holdPeek}
		onpointerleave={unpeekSoon}
	>
		{#if shownBeat}
			{#key shownBeat.id}
				<BeatCard beat={shownBeat} compact autoplay={!!peekBeat} />
			{/key}
		{/if}
	</div>
</section>

<style>
	.transcript {
		width: 100%;
		max-width: 820px;
		margin: 0 auto;
		padding: 6px var(--gutter) 96px 8px;
	}
	/* WHY: the toggle row is the only header here, so the first paragraph sits right under it. */
	.transcript :global(.head) {
		margin-bottom: 2px;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	.transcript-toggle[aria-pressed="true"] {
		background: var(--raised);
		color: var(--text);
	}
	.key {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.key i {
		width: 12px;
		height: 8px;
		border-radius: var(--radius-xs);
		background: color-mix(in oklab, var(--mark) 26%, transparent);
		box-shadow: 0 2px 0 var(--mark);
	}
	.m-cut {
		--mark: var(--bad);
	}
	.m-moved {
		--mark: var(--accent);
	}
	.m-pause {
		--mark: var(--warn);
	}
	.para {
		scroll-margin-top: 56px;
	}
	.ch {
		margin: 24px 0 6px 48px;
		font: 650 var(--fs-lg) / 1.3 var(--display);
		letter-spacing: -0.01em;
	}
	.para:first-child .ch {
		margin-top: 8px;
	}
	.row {
		display: grid;
		grid-template-columns: 40px minmax(0, 1fr);
		gap: 8px;
		padding: 5px 0;
	}
	.at {
		padding-top: 3px;
		color: var(--faint);
		font: 500 var(--fs-xs) / 1.9 var(--mono);
		text-align: right;
	}
	.text {
		font-size: var(--fs-lg);
		line-height: 1.75;
		text-wrap: pretty;
	}
	.line {
		border-radius: var(--radius-xs);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		transition:
			background-color var(--duration-fast) var(--ease-smooth-out),
			box-shadow var(--duration-fast) var(--ease-smooth-out),
			color var(--duration-fast) var(--ease-smooth-out);
	}
	.line.m-cut {
		background: color-mix(in oklab, var(--bad) 16%, transparent);
		color: var(--dim);
		text-decoration: line-through;
		text-decoration-color: color-mix(in oklab, var(--bad) 70%, transparent);
	}
	.line.m-moved {
		background: color-mix(in oklab, var(--accent) 14%, transparent);
		box-shadow: 0 2px 0 var(--accent);
	}
	.line.m-pause {
		box-shadow: 0 2px 0 var(--warn);
		background: color-mix(in oklab, var(--warn) 10%, transparent);
	}
	.w {
		border-radius: var(--radius-xs);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		transition:
			background-color var(--duration-fast) var(--ease-smooth-out),
			color var(--duration-fast) var(--ease-smooth-out);
	}
	.seekable .w {
		cursor: pointer;
	}
	.seekable .w:hover {
		background: color-mix(in oklab, var(--accent) 12%, transparent);
	}
	.w.now,
	.seekable .w.now:hover {
		background: color-mix(in oklab, var(--accent) 34%, transparent);
		color: var(--text);
	}
	.line.noted {
		cursor: pointer;
		text-decoration: underline;
		text-decoration-color: var(--accent);
		text-decoration-thickness: 2px;
		text-underline-offset: 4px;
	}
	.line.m-cut.noted {
		text-decoration-line: line-through underline;
	}
	.line::selection,
	.line ::selection {
		background: color-mix(in oklab, var(--accent) 40%, transparent);
	}
	/* WHY: a pin is a 22px chip with its kind's icon, wide enough to hover without hunting for it. */
	.pin {
		position: relative;
		display: inline-grid;
		place-items: center;
		width: 22px;
		height: 22px;
		margin: 0 1px;
		vertical-align: -5px;
		border-radius: var(--radius-sm);
		background: var(--tone-soft);
		color: var(--tone);
		box-shadow: 0 0 0 1px color-mix(in oklab, var(--tone) 40%, transparent);
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			box-shadow var(--duration-quick) var(--ease-smooth-out),
			transform var(--duration-micro) var(--ease-smooth-out),
			opacity var(--duration-quick) var(--ease-smooth-out);
	}
	.pin:hover,
	.pin.peeking {
		box-shadow: 0 0 0 1.5px var(--tone);
	}
	.pin:focus-visible {
		outline: 2px solid var(--tone);
		outline-offset: 2px;
	}
	.pin:active {
		transform: scale(var(--scale-large));
	}
	.pin.on {
		background: var(--tone);
		color: var(--ground);
	}
	.peek {
		position: fixed;
		inset: auto;
		width: min(380px, calc(100vw - 16px));
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: var(--radius-lg);
		background: var(--raised);
		color: var(--text);
		box-shadow: var(--shadow-pop);
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		/* The close is shorter than the open and drops the travel, so dismissing gets out of the way. */
		opacity: 0;
		scale: var(--dropdown-pre-scale);
		transition:
			opacity var(--dropdown-close-dur) var(--ease-smooth-out),
			scale var(--dropdown-close-dur) var(--ease-smooth-out),
			translate var(--dropdown-close-dur) var(--ease-smooth-out),
			display var(--dropdown-close-dur) allow-discrete,
			overlay var(--dropdown-close-dur) allow-discrete;
	}
	.peek:popover-open {
		opacity: 1;
		scale: 1;
		translate: 0 0;
		transition-duration: var(--dropdown-open-dur);
	}
	@starting-style {
		.peek:popover-open {
			opacity: 0;
			scale: var(--dropdown-pre-scale);
		}
		.peek:popover-open[data-side="above"] {
			translate: 0 var(--distance-micro);
		}
		.peek:popover-open[data-side="below"] {
			translate: 0 calc(var(--distance-micro) * -1);
		}
	}
	/* The peek stacks the clip over the words, so the motion gets the full card width. */
	.peek :global(.beat.compact) {
		grid-template-columns: 1fr;
		gap: 12px;
		margin: 0;
		border: 0;
	}
	.peek :global(.opts) {
		max-height: 64px;
	}
	/* WHY: a clipped button gets scrolled into view on press, moves under the pointer, and the click is lost. */
	.peek :global(.acts) {
		position: sticky;
		bottom: -12px;
		margin-bottom: -12px;
		padding: 8px 0 12px;
		background: var(--raised);
	}
	@media (hover: none) {
		.peek {
			display: none;
		}
	}
	.pin.p-approved::after {
		content: "";
		position: absolute;
		right: -2px;
		top: -2px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--ok);
		box-shadow: 0 0 0 2px var(--ground);
	}
	.pin.p-skipped {
		opacity: 0.45;
	}
	@media (max-width: 760px) {
		.row {
			grid-template-columns: 1fr;
			gap: 0;
		}
		.at {
			text-align: left;
			line-height: 1.2;
		}
		.at:empty {
			display: none;
		}
		.ch {
			margin-left: 0;
		}
		.transcript {
			padding-left: var(--gutter);
		}
		.text {
			font-size: var(--fs-md);
		}
	}
</style>

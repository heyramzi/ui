<script lang="ts">
	import "#src/slides/theme.css";
	import { Progress } from "bits-ui";
	import { flushSync, onMount, setContext, untrack } from "svelte";
	import { attachBridge, attachChannel, attachUrlSync } from "#src/slides/bridges.js";
	import Controls from "#src/slides/Controls.svelte";
	import { DeckController } from "#src/slides/deck-controller.svelte.js";
	import Overview from "#src/slides/Overview.svelte";
	import SlideList from "#src/slides/SlideList.svelte";
	import { DECK_KEY, DEFAULT_CANVAS, type DeckProps } from "#src/slides/types.js";

	let {
		index = $bindable(0),
		step = $bindable(0),
		controller = $bindable(),
		id,
		title,
		locale,
		canvas = DEFAULT_CANVAS,
		theme = "ink",
		transition = "fade",
		slides,
		registry,
		progress = true,
		controls = true,
		loop = false,
		keyboard = true,
		fragments = true,
		urlSync = false,
		bridge = false,
		sync,
		presenter,
		labels,
		class: className,
		style,
		onIndexChange,
		children,
	}: DeckProps = $props();

	/* The accessors read and write the bindable props, so the controller keeps no copy of them. */
	const deck = new DeckController({
		get index() {
			return index;
		},
		set index(value) {
			index = value;
		},
		get step() {
			return step;
		},
		set step(value) {
			step = value;
		},
		get loop() {
			return loop;
		},
		get fragments() {
			return fragments;
		},
		get keyboard() {
			return keyboard;
		},
		get presenter() {
			return !!presenter;
		},
		get controls() {
			return controls;
		},
		get canvas() {
			return canvas;
		},
		get labels() {
			return labels;
		},
		transition: viewTransition,
		zoomMs,
	});
	controller = deck;
	setContext(DECK_KEY, deck);

	let root = $state<HTMLElement>();
	let stage = $state<HTMLElement>();

	/* Morph hands the swap to the browser, which animates elements sharing a `data-morph` name. */
	function viewTransition(update: () => void) {
		const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (transition !== "morph" || reduced || !document.startViewTransition) return update();
		document.documentElement.dataset.deckVt = "";
		const run = document.startViewTransition(() => flushSync(update));
		run.finished.finally(() => delete document.documentElement.dataset.deckVt);
	}

	/* The overview zoom's length, read from the CSS so it follows the token. 0 under reduced motion. */
	function zoomMs() {
		if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
		const value = getComputedStyle(root).getPropertyValue("--deck-t-zoom").trim();
		const ms = Number.parseFloat(value) * (value.endsWith("ms") ? 1 : 1000);
		return Number.isFinite(ms) ? ms : 0;
	}

	onMount(() => deck.mount());

	$effect(() => deck.listen((position) => onIndexChange?.(position.index, position.step)));
	$effect(() => {
		const options = urlSync;
		if (options) return untrack(() => attachUrlSync(deck, options === true ? {} : options));
	});
	$effect(() => {
		const options = bridge;
		if (options) return untrack(() => attachBridge(deck, options === true ? {} : options));
	});
	$effect(() => {
		const name = sync;
		if (name) return untrack(() => attachChannel(deck, name));
	});

	$effect(() => {
		const el = stage;
		if (!el) return;
		const measure = () => (deck.size = { w: el.offsetWidth, h: el.offsetHeight });
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	});

	async function toggleFullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await root?.requestFullscreen();
		} catch {
			/* A browser without the API, or a denied request. */
		}
	}

	const openPresenter = $derived(
		presenter
			? () =>
					void window.open(presenter, `heyramzi-slides-${id ?? ""}`, "popup,width=1280,height=800")
			: undefined,
	);

	function onkeydown(event: KeyboardEvent) {
		// WHY on the window: fullscreen can leave focus on body, and the deck still owns the keys then.
		const inside = event.target instanceof Node && root?.contains(event.target);
		if (!inside && document.fullscreenElement !== root) return;
		const action = deck.handleKey(event);
		if (action === "fullscreen") void toggleFullscreen();
		else if (action === "presenter") openPresenter?.();
	}

	let swipe: { x: number; y: number } | null = null;
	function onpointerdown(event: PointerEvent) {
		swipe = event.pointerType === "mouse" ? null : { x: event.clientX, y: event.clientY };
	}
	function onpointerup(event: PointerEvent) {
		if (!swipe || deck.overview) return;
		const dx = event.clientX - swipe.x;
		const dy = event.clientY - swipe.y;
		swipe = null;
		if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
		if (dx < 0) deck.next();
		else deck.prev();
	}
</script>

<svelte:head>
	{@html `<style>@page{size:${canvas.w}px ${canvas.h}px;margin:0}</style>`}
</svelte:head>
<svelte:window {onkeydown} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	bind:this={root}
	class={["deck", `deck--${theme}`, className]}
	style:aspect-ratio="{canvas.w} / {canvas.h}"
	style:--deck-dir={deck.direction}
	{style}
	lang={locale}
	role="region"
	aria-roledescription={deck.labels.deckRole}
	aria-label={title ?? deck.labels.deck}
	tabindex="0"
	data-deck={id}
	data-view={deck.view}
	data-transition={transition}
	data-zoom={deck.zoom ? (deck.zoom.running ? "run" : "hold") : undefined}
	{onpointerdown}
	{onpointerup}
>
	<div bind:this={stage} class="deck__stage">
		{#if slides && registry}
			<SlideList {slides} {registry} unknownLabel={deck.labels.unknownType} />
		{:else}
			{@render children?.()}
		{/if}
		<!-- The tiles mount once the camera starts pulling back, and fade in as it lands. -->
		{#if deck.overview && !deck.zoom?.framed}
			<Overview {deck} returnFocus={root} />
		{/if}
	</div>

	<div class="deck__sr" aria-live="polite" aria-atomic="true">
		{deck.labels.slide(deck.ordinal.n, deck.ordinal.of)}
	</div>

	{#if progress}
		<Progress.Root
			min={1}
			max={deck.ordinal.of}
			value={deck.ordinal.n}
			aria-label={deck.labels.progress}
			aria-valuetext={deck.labels.slide(deck.ordinal.n, deck.ordinal.of)}
		>
			{#snippet child({ props })}
				<div {...props} class="deck__progress deck__chrome">
					<div class="deck__progress-fill" style:transform="scaleX({deck.progress})"></div>
				</div>
			{/snippet}
		</Progress.Root>
	{/if}

	{#if controls}
		<Controls {deck} onPresenter={openPresenter} onFullscreen={toggleFullscreen} />
	{/if}
</div>

<style>
	@layer theme, base, components, utilities;

	@layer components {
		.deck {
			position: relative;
			display: block;
			width: 100%;
			height: 100%;
			min-height: 0;
			overflow: hidden;
			container-type: inline-size;
			background: var(--deck-letterbox);
			color: var(--deck-fg);
			font-family: var(--deck-font);
			outline: none;
			touch-action: pan-y;
			-webkit-tap-highlight-color: transparent;
		}

		.deck:focus-visible {
			outline: 2px solid var(--deck-accent);
			outline-offset: -2px;
		}

		.deck:fullscreen {
			background: var(--deck-bg);
		}

		.deck__stage {
			position: absolute;
			inset: 0;
			overflow: hidden;
		}

		.deck__progress {
			position: absolute;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: 5;
			height: 3px;
			background: var(--deck-line);
		}

		.deck__progress-fill {
			height: 100%;
			background: var(--deck-accent);
			transform-origin: 0 50%;
			transition: transform var(--deck-t-morph) var(--deck-ease);
		}

		.deck__sr {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		@media (prefers-reduced-motion: reduce) {
			.deck__progress-fill {
				transition: none;
			}
		}
	}
</style>

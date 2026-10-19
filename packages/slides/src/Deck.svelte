<script lang="ts">
  import '#src/theme.css';
  import { flushSync, onMount, setContext, untrack } from 'svelte';
  import { attachBridge, attachChannel, attachUrlSync } from '#src/bridges.js';
  import Controls from '#src/Controls.svelte';
  import { DeckController } from '#src/deck-controller.svelte.js';
  import Overview from '#src/Overview.svelte';
  import SlideList from '#src/SlideList.svelte';
  import { DECK_KEY, DEFAULT_CANVAS, type DeckProps } from '#src/types.js';

  let {
    index = $bindable(0),
    step = $bindable(0),
    controller = $bindable(),
    id,
    title,
    locale,
    canvas = DEFAULT_CANVAS,
    theme = 'ink',
    transition = 'fade',
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
    onchange,
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
  });
  controller = deck;
  setContext(DECK_KEY, deck);

  let root = $state<HTMLElement>();
  let stage = $state<HTMLElement>();

  /* Morph hands the swap to the browser, which animates elements sharing a `data-morph` name. */
  function viewTransition(update: () => void) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (transition !== 'morph' || reduced || !document.startViewTransition) return update();
    document.documentElement.dataset.deckVt = '';
    const run = document.startViewTransition(() => flushSync(update));
    run.finished.finally(() => delete document.documentElement.dataset.deckVt);
  }

  onMount(() => deck.mount());

  $effect(() => deck.listen((position) => onchange?.(position.index, position.step)));
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
    presenter ? () => void window.open(presenter, `heyramzi-slides-${id ?? ''}`, 'popup,width=1280,height=800') : undefined,
  );

  function onkeydown(event: KeyboardEvent) {
    const action = deck.handleKey(event);
    if (action === 'fullscreen') void toggleFullscreen();
    else if (action === 'presenter') openPresenter?.();
  }

  let swipe: { x: number; y: number } | null = null;
  function onpointerdown(event: PointerEvent) {
    deck.activate();
    swipe = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY };
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
  class={['deck', `deck--${theme}`, className]}
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
  data-morphing={deck.morphing || undefined}
  onfocusin={() => deck.activate()}
  onpointerenter={() => deck.activate()}
  {onpointerdown}
  {onpointerup}
>
  <div bind:this={stage} class="deck__stage">
    {#if slides && registry}
      <SlideList {slides} {registry} unknownLabel={deck.labels.unknownType} />
    {:else}
      {@render children?.()}
    {/if}
    {#if deck.overview}
      <Overview {deck} returnFocus={root} />
    {/if}
  </div>

  <div class="deck__sr" aria-live="polite" aria-atomic="true">{deck.labels.slide(deck.ordinal.n, deck.ordinal.of)}</div>

  {#if progress}
    <div
      class="deck__progress deck__chrome"
      role="progressbar"
      aria-label={deck.labels.progress}
      aria-valuemin="1"
      aria-valuemax={deck.ordinal.of}
      aria-valuenow={deck.ordinal.n}
      aria-valuetext={deck.labels.slide(deck.ordinal.n, deck.ordinal.of)}
    >
      <div class="deck__progress-fill" style:transform="scaleX({deck.progress})"></div>
    </div>
  {/if}

  {#if controls}
    <Controls {deck} onpresenter={openPresenter} onfullscreen={toggleFullscreen} />
  {/if}
</div>

<style>
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
</style>

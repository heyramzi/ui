<script lang="ts">
  import { untrack } from 'svelte';
  import Deck from './Deck.svelte';
  import type { DeckController } from './deck-controller.svelte';
  import { resolveLabels } from './labels';
  import { DEFAULT_CANVAS, type DeckProps } from './types';

  type Props = Pick<
    DeckProps,
    'id' | 'title' | 'locale' | 'canvas' | 'theme' | 'transition' | 'slides' | 'registry' | 'labels' | 'style' | 'children'
  > & { /** The channel name the audience deck uses as its `sync`. */ sync: string };

  let { sync, id, title, locale, canvas = DEFAULT_CANVAS, theme = 'ink', transition, slides, registry, labels: overrides, style, children }: Props =
    $props();

  const labels = $derived(resolveLabels(overrides));

  let index = $state(0);
  let step = $state(0);
  let now = $state<DeckController>();

  const upcoming = $derived(now?.upcoming ?? null);
  const notes = $derived(now?.current?.notes);
  const steps = $derived(now?.current?.steps ?? 0);

  let elapsed = $state(0);
  let running = $state(true);
  $effect(() => {
    if (!running) return;
    const base = untrack(() => elapsed);
    const start = Date.now();
    const tick = setInterval(() => (elapsed = base + Math.round((Date.now() - start) / 1000)), 250);
    return () => clearInterval(tick);
  });

  const clock = $derived.by(() => {
    const [h, m, s] = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60];
    const pad = (n: number) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  });

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 't' && !event.metaKey && !event.ctrlKey && !event.altKey) running = !running;
  }
</script>

<svelte:window {onkeydown} />
<svelte:head>
  <title>{title ?? labels.deck}</title>
</svelte:head>

<div class="presenter deck-surface deck--{theme}" lang={locale} style:--ratio={canvas.w / canvas.h} {style}>
  <header class="presenter__bar">
    <h1 class="presenter__title">{title ?? labels.deck}</h1>
    {#if now}
      <span class="presenter__where">
        {labels.slide(now.ordinal.n, now.ordinal.of)}{#if steps > 0}<span class="presenter__steps">{now.position.step}/{steps}</span>{/if}
      </span>
    {/if}
    <div class="presenter__timer" role="timer" aria-label={labels.timer}>
      <span class="presenter__clock">{clock}</span>
      <button type="button" class="presenter__button" onclick={() => (running = !running)}>
        {running ? labels.pauseTimer : labels.startTimer}
      </button>
      <button type="button" class="presenter__button" onclick={() => (elapsed = 0)}>{labels.resetTimer}</button>
    </div>
  </header>

  <main class="presenter__main">
    <section class="presenter__now" aria-label={labels.current}>
      <div class="presenter__frame" style:aspect-ratio="{canvas.w} / {canvas.h}">
        <Deck
          bind:index
          bind:step
          bind:controller={now}
          {sync}
          {id}
          {title}
          {locale}
          {canvas}
          {theme}
          {transition}
          {slides}
          {registry}
          {labels}
          {style}
          controls={false}
        >
          {@render children?.()}
        </Deck>
      </div>
    </section>

    <aside class="presenter__side">
      <section aria-label={labels.upcoming}>
        <h2 class="presenter__heading">{labels.upcoming}</h2>
        {#if upcoming !== null}
          <div class="presenter__frame presenter__frame--next" style:aspect-ratio="{canvas.w} / {canvas.h}" inert>
            <Deck
              index={upcoming}
              step={Number.MAX_SAFE_INTEGER}
              {id}
              {canvas}
              {theme}
              {slides}
              {registry}
              {labels}
              {style}
              transition="none"
              controls={false}
              progress={false}
              keyboard={false}
            >
              {@render children?.()}
            </Deck>
          </div>
        {:else}
          <p class="presenter__empty">{labels.endOfDeck}</p>
        {/if}
      </section>

      <section class="presenter__notes" aria-label={labels.notes}>
        <h2 class="presenter__heading">{labels.notes}</h2>
        <div class="presenter__notes-body">
          {#if typeof notes === 'string'}
            <p>{notes}</p>
          {:else if notes}
            {@render notes()}
          {:else}
            <p class="presenter__empty">{labels.noNotes}</p>
          {/if}
        </div>
      </section>
    </aside>
  </main>
</div>

<style>
  .presenter {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    height: 100dvh;
    color: var(--deck-fg);
    background: var(--deck-bg);
    font-family: var(--deck-font);
  }

  .presenter__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 20px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--deck-line);
  }
  .presenter__title {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font: 600 15px/1.2 var(--deck-font);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .presenter__where {
    display: flex;
    align-items: center;
    gap: 10px;
    font: 500 14px/1 var(--deck-font);
    color: var(--deck-muted);
  }
  .presenter__steps {
    padding: 3px 7px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    color: var(--deck-on-accent);
    background: var(--deck-accent);
    border-radius: 6px;
  }
  .presenter__timer {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .presenter__clock {
    min-width: 5ch;
    margin-right: 4px;
    font: 700 28px/1 var(--deck-font-display);
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }
  .presenter__button {
    min-height: 32px;
    padding: 0 12px;
    font: 500 13px/1 var(--deck-font);
    color: var(--deck-fg);
    background: var(--deck-surface);
    border: 1px solid var(--deck-line);
    border-radius: 8px;
    cursor: pointer;
    transition: background-color var(--deck-t-quick) var(--deck-ease);
  }
  .presenter__button:hover {
    background: var(--deck-line);
  }
  .presenter__button:focus-visible {
    outline: 2px solid var(--deck-accent);
    outline-offset: 2px;
  }

  .presenter__main {
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
    gap: 20px;
    min-height: 0;
    padding: 20px;
  }
  .presenter__now {
    display: grid;
    place-items: center;
    min-height: 0;
    container-type: size;
  }
  .presenter__frame {
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 0 0 1px var(--deck-line);
  }
  .presenter__now .presenter__frame {
    width: min(100cqw, calc(100cqh * var(--ratio)));
  }
  .presenter__frame--next {
    width: 100%;
  }

  .presenter__side {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 20px;
    min-height: 0;
  }
  .presenter__heading {
    margin: 0 0 8px;
    font: 600 12px/1 var(--deck-font);
    letter-spacing: 0.02em;
    color: var(--deck-muted);
  }
  .presenter__notes {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .presenter__notes-body {
    flex: 1;
    min-height: 0;
    padding-right: 4px;
    overflow-y: auto;
    font-size: clamp(18px, 1.5vw, 26px);
    line-height: 1.5;
    white-space: pre-line;
    text-wrap: pretty;
  }
  .presenter__notes-body p {
    margin: 0;
  }
  .presenter__empty {
    margin: 0;
    color: var(--deck-muted);
  }

  @media (max-width: 860px) {
    .presenter {
      height: auto;
      min-height: 100dvh;
    }
    .presenter__main {
      grid-template-columns: minmax(0, 1fr);
    }
    .presenter__now {
      container-type: inline-size;
    }
    .presenter__now .presenter__frame {
      width: 100%;
    }
  }
</style>

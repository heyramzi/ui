<script lang="ts">
  import Demo from "@heyramzi/slides/demo.svelte";
  import PackagePage from "#lib/PackagePage.svelte";
  import { highlight } from "#lib/highlight.js";

  const children = `<script>
  import { Deck, Slide, Fragment } from "@heyramzi/slides";
<\/script>

<Deck title="Q3 review" urlSync presenter="/present">
  <Slide notes="Open on the number.">
    <h1 class="deck-display">Revenue is up</h1>
  </Slide>
  <Slide>
    <Fragment step={1}>First point</Fragment>
    <Fragment step={2}>Second point</Fragment>
  </Slide>
</Deck>`;

  const data = `import { defineRegistry, defineSlideType } from "@heyramzi/slides/model";

const cover = defineSlideType({ type: "cover", label: "Cover", layout: CoverLayout });
const registry = defineRegistry([cover]);

// <Deck {...deck} {registry} />   deck = { id, title, canvas, slides }`;
</script>

<PackagePage id="slides" blurb="Decks on a fixed canvas that scales to any screen. Press O for the overview.">
  <Demo presenter="/slides/presenter" />

  <div class="mt-16 grid gap-6 lg:grid-cols-2 print:hidden">
    <div>
      <h2 class="mb-3 text-lg font-semibold tracking-tight">Write slides</h2>
      <pre class="code-block overflow-auto rounded-2xl border border-border bg-muted/40 p-5 font-mono text-[13px] leading-relaxed"><code>{@html highlight(children)}</code></pre>
    </div>
    <div>
      <h2 class="mb-3 text-lg font-semibold tracking-tight">Or write data</h2>
      <pre class="code-block overflow-auto rounded-2xl border border-border bg-muted/40 p-5 font-mono text-[13px] leading-relaxed"><code>{@html highlight(data)}</code></pre>
    </div>
  </div>
</PackagePage>

<style>
  /* Print the deck and nothing else: no nav, footer, page padding or margins. */
  @media print {
    :global(body:has(.demo) .sticky),
    :global(body:has(.demo) footer) {
      display: none !important;
    }
    :global(body:has(.demo) main > div) {
      max-width: none !important;
      padding: 0 !important;
    }
    :global(body:has(.demo) main > div > div) {
      margin: 0 !important;
    }
  }
</style>

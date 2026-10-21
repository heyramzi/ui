export const slidesAsMarkup = `<script>
  import { Deck, Slide, Fragment } from "@heyramzi/ui/slides";
</script>

<Deck title="Q3 review" urlSync presenter="/present">
  <Slide notes="Open on the number.">
    <h1 class="deck-display">Revenue is up</h1>
  </Slide>
  <Slide>
    <Fragment step={1}>First point</Fragment>
    <Fragment step={2}>Second point</Fragment>
  </Slide>
</Deck>`;

export const slidesAsData = `import { defineRegistry, defineSlideType } from "@heyramzi/ui/slides/model";

const cover = defineSlideType({ type: "cover", label: "Cover", layout: CoverLayout });
const registry = defineRegistry([cover]);

// <Deck {...deck} {registry} />   deck = { id, title, canvas, slides }`;

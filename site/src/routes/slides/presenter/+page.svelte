<script lang="ts">
  import { Presenter } from "@heyramzi/ui/slides";
  import DemoSlides, { demoStyle } from "@heyramzi/ui/slides/demo-slides.svelte";
</script>

<!-- The site layout draws a nav and footer. The presenter owns the whole window. -->
<div class="fixed inset-0 z-50">
  <Presenter sync="slides-demo" id="slides-demo" title="Slides demo" style={demoStyle}>
    <DemoSlides />
  </Presenter>
</div>

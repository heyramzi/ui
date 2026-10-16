<script lang="ts">
  import { Draw, Toolbar, createEditor, defineNodes, SCHEMA_VERSION, type Snapshot } from "@heyramzi/draw";

  const snapshot: Snapshot = {
    schema: SCHEMA_VERSION,
    shapes: {
      "rect-1": { id: "rect-1", type: "rect", x: 60, y: 50, w: 200, h: 120, rotation: 0, parentId: null, index: "a0", props: { accent: "violet", fill: false, radius: 10 } },
      "ellipse-1": { id: "ellipse-1", type: "ellipse", x: 300, y: 90, w: 160, h: 110, rotation: 0, parentId: null, index: "a1", props: { accent: "teal", fill: false } },
    },
    bindings: {},
    camera: { x: 0, y: 0, zoom: 1 },
  };

  const editor = createEditor({ snapshot });
  const nodes = defineNodes({});
  let dark = $state(false);
</script>

<div class="relative h-80 w-full overflow-hidden rounded-xl border border-border bg-background">
  <Draw {editor} {nodes} {dark} />
  <div class="absolute bottom-3 left-1/2 -translate-x-1/2">
    <Toolbar {editor} {dark} />
  </div>
</div>

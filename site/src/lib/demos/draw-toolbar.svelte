<script lang="ts">
  import { Toolbar, createEditor, SCHEMA_VERSION, type Snapshot } from "@heyramzi/draw";

  const snapshot: Snapshot = {
    schema: SCHEMA_VERSION,
    shapes: {},
    bindings: {},
    camera: { x: 0, y: 0, zoom: 1 },
  };

  const editor = createEditor({ snapshot });
  let dark = $state(false);
</script>

<div class="flex min-h-24 w-full items-center justify-center">
  <Toolbar {editor} {dark} />
</div>

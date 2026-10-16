<script lang="ts">
  import type { Component } from "svelte";
  import type { NodeComponentProps } from "../core/types";
  import type { NodeHostProps } from "../render/contract";

  let { shape, component, selected }: NodeHostProps = $props();

  const data = $derived((shape.props as { data?: Record<string, unknown> }).data ?? {});
  const Node = $derived(component as Component<NodeComponentProps>);
</script>

<div class="draw-node-host">
  <svelte:boundary>
    {#snippet failed(error)}
      <div class="draw-node-error" title={String(error)}>This node failed to render</div>
    {/snippet}
    <Node id={shape.id} {data} {selected} width={shape.w} height={shape.h} />
  </svelte:boundary>
</div>

<style>
  .draw-node-host {
    width: 100%;
    height: 100%;
    /* The select tool owns every pointer event; a node's inner controls wait. */
    pointer-events: none;
  }

  .draw-node-error {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 1px dashed #c92a2a;
    border-radius: 6px;
    color: #c92a2a;
    font: 12px/1.4 sans-serif;
  }
</style>

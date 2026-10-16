<script lang="ts">
  import type { Component } from "svelte";
  import { screenToPage, type Id, type NodeComponentProps, type ShapeRecord } from "./core";
  import type { DrawProps } from "./render/contract";
  import { cullShapes, pageViewport, zOrdered } from "./render/cull";
  import {
    applyWheel,
    isHandledKey,
    isTextEntryTarget,
    modsOf,
    pointerInput,
    toolForKey,
  } from "./render/input";
  import {
    guideScreen,
    polygonPoints,
    rotatedScreenCorners,
    screenRect,
    selectionScreen,
  } from "./render/overlay";
  import { registerDefaultTools } from "./render/tools";
  import TextEditor from "./render/TextEditor.svelte";
  import NodeHost from "./nodes/NodeHost.svelte";
  import { trackEditor } from "./runes/useEditor.svelte";

  let { editor, nodes, style = "hand", dark = false, class: klass = "" }: DrawProps = $props();

  const tracker = trackEditor(editor);
  registerDefaultTools(editor);

  /** Page units of slack around the viewport before a shape is culled. */
  const CULL_MARGIN_PX = 32;

  let root: HTMLDivElement | undefined = $state();
  let size = $state({ w: 0, h: 0 });
  let hoverId: Id | null = $state(null);
  let activePointer: number | null = null;
  let toolBeforeSpace: string | null = null;
  let middlePrevTool: string | null = null;

  const camera = $derived.by(() => {
    tracker.version;
    return editor.getCamera();
  });
  const shapes = $derived.by(() => {
    tracker.version;
    return zOrdered(editor.getShapes());
  });
  const selected = $derived.by(() => {
    tracker.version;
    return new Set(editor.getSelectedIds());
  });
  const editingId = $derived.by(() => {
    tracker.version;
    return editor.getEditingId();
  });
  const cursor = $derived.by(() => {
    tracker.version;
    return editor.getCursor();
  });
  const viewport = $derived(pageViewport(camera, size));
  const visible = $derived.by(() => {
    tracker.version;
    const margin = CULL_MARGIN_PX / (camera.zoom || 1);
    const kept = new Set(cullShapes(editor, shapes, viewport, margin).map((shape) => shape.id));
    // The shape under the text editor stays mounted while it edits offscreen.
    return shapes.filter((shape) => shape.id === editingId || kept.has(shape.id));
  });
  const selection = $derived.by(() => {
    tracker.version;
    return selectionScreen(editor);
  });
  const brush = $derived.by(() => {
    tracker.version;
    const box = editor.getBrush();
    return box ? screenRect(box, camera) : null;
  });
  const guideLines = $derived.by(() => {
    tracker.version;
    return editor.getGuides().map((guide) => guideScreen(guide, camera));
  });
  const hover = $derived.by(() => {
    tracker.version;
    if (!hoverId || selected.has(hoverId) || !editor.getActivePath().startsWith("select")) return null;
    const shape = editor.getShape(hoverId);
    if (!shape) return null;
    return rotatedScreenCorners(
      { x: shape.x, y: shape.y, w: shape.w, h: shape.h },
      shape.rotation,
      camera
    );
  });
  const cameraTransform = $derived(
    `translate(${-camera.x * camera.zoom} ${-camera.y * camera.zoom}) scale(${camera.zoom})`
  );

  $effect(() => {
    const el = root;
    if (!el) return;
    const measure = (): void => {
      size = { w: el.clientWidth, h: el.clientHeight };
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  });

  function rect(): { left: number; top: number } {
    return root?.getBoundingClientRect() ?? { left: 0, top: 0 };
  }

  function activeToolRoot(): string {
    return editor.getActivePath().split(".")[0] || "select";
  }

  function beginSpacePan(): void {
    if (toolBeforeSpace !== null) return;
    toolBeforeSpace = activeToolRoot();
    editor.setTool("hand");
  }

  function endSpacePan(): void {
    if (toolBeforeSpace === null) return;
    const restore = toolBeforeSpace;
    toolBeforeSpace = null;
    editor.setTool(restore);
  }

  function cancelPointer(): void {
    editor.dispatch({ type: "cancel" });
    hoverId = null;
    if (middlePrevTool) {
      const restore = middlePrevTool;
      middlePrevTool = null;
      editor.setTool(restore);
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (isTextEntryTarget(event.target)) return;
    if (event.button === 1) {
      event.preventDefault();
      middlePrevTool = activeToolRoot();
      editor.setTool("hand");
    }
    activePointer = event.pointerId;
    root?.setPointerCapture(event.pointerId);
    editor.dispatch({ type: "pointer_down", input: pointerInput(event, rect()) });
  }

  function onPointerMove(event: PointerEvent): void {
    if (isTextEntryTarget(event.target)) return;
    const input = pointerInput(event, rect());
    editor.dispatch({ type: "pointer_move", input });
    if (editor.getActivePath().startsWith("select") && !editor.getEditingId()) {
      hoverId = editor.getTopShapeAt(screenToPage(editor.getCamera(), input.screen));
    }
  }

  function onPointerUp(event: PointerEvent): void {
    if (isTextEntryTarget(event.target)) return;
    activePointer = null;
    editor.dispatch({ type: "pointer_up", input: pointerInput(event, rect()) });
    if (root?.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    if (middlePrevTool) {
      const restore = middlePrevTool;
      middlePrevTool = null;
      editor.setTool(restore);
    }
  }

  function onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== activePointer) return;
    activePointer = null;
    cancelPointer();
  }

  function onLostCapture(event: PointerEvent): void {
    if (activePointer === null || event.pointerId !== activePointer) return;
    activePointer = null;
    cancelPointer();
  }

  function onBlur(): void {
    if (editor.getEditingId() || activePointer === null) return;
    activePointer = null;
    cancelPointer();
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    const el = root;
    if (!el) return;
    editor.setCamera(applyWheel(editor.getCamera(), event, el.getBoundingClientRect(), el.clientHeight));
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (isTextEntryTarget(event.target) || editor.getEditingId()) return;
    if (event.key === " ") {
      event.preventDefault();
      beginSpacePan();
      return;
    }
    const tool = toolForKey(event);
    editor.dispatch({ type: "key_down", key: event.key, mods: modsOf(event) });
    if (tool) editor.setTool(tool);
    if (isHandledKey(event)) event.preventDefault();
  }

  function onKeyUp(event: KeyboardEvent): void {
    if (event.key === " ") {
      event.preventDefault();
      endSpacePan();
      return;
    }
    if (isTextEntryTarget(event.target) || editor.getEditingId()) return;
    editor.dispatch({ type: "key_up", key: event.key });
  }

  function nodeComponent(shape: ShapeRecord): Component<NodeComponentProps<unknown>> | null {
    if (shape.type !== "node" || !nodes) return null;
    const kind = (shape.props as { kind?: string }).kind;
    if (!kind) return null;
    return nodes[kind] ?? null;
  }

  function nodeTransform(shape: ShapeRecord): string {
    const cx = shape.x + shape.w / 2;
    const cy = shape.y + shape.h / 2;
    return `rotate(${(shape.rotation * 180) / Math.PI} ${cx} ${cy})`;
  }

  function shapeSvg(shape: ShapeRecord): string {
    try {
      return editor.getShapeUtil(shape.type).toSvg(shape, { dark, style });
    } catch {
      return "";
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={root}
  class="draw-root {klass}"
  class:draw-dark={dark}
  style:--draw-bg={dark ? "#1a1a1a" : "#ffffff"}
  style:--draw-fg={dark ? "#f1f3f5" : "#1e1e1e"}
  style:--draw-accent={dark ? "#74c0fc" : "#2f6feb"}
  style:--draw-canvas={dark ? "#101014" : "#f8f9fa"}
  style:color-scheme={dark ? "dark" : "light"}
  style:cursor={cursor}
  role="application"
  aria-label="Drawing canvas"
  tabindex="0"
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerCancel}
  onlostpointercapture={onLostCapture}
  onblur={onBlur}
  onwheel={onWheel}
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
>
  <svg class="draw-svg" width="100%" height="100%" aria-hidden="true">
    <g transform={cameraTransform}>
      {#each visible as shape (shape.id)}
        {@const component = nodeComponent(shape)}
        {#if component}
          <g transform={nodeTransform(shape)}>
            <foreignObject
              class="draw-node-fo"
              x={shape.x}
              y={shape.y}
              width={shape.w}
              height={shape.h}
            >
              <div class="draw-node-html" xmlns="http://www.w3.org/1999/xhtml">
                <NodeHost shape={shape} {component} selected={selected.has(shape.id)} />
              </div>
            </foreignObject>
          </g>
        {:else}
          {@html shapeSvg(shape)}
        {/if}
      {/each}
    </g>

    <g class="draw-overlay">
      {#if hover}
        <polygon class="draw-hover" points={polygonPoints(hover)} />
      {/if}
      {#each guideLines as line}
        <line class="draw-guide" x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} />
      {/each}
      {#if selection}
        <polygon class="draw-selection" points={polygonPoints(selection.corners)} />
        {#each selection.resize as grip (grip.handle)}
          <rect class="draw-grip" x={grip.point.x - 4} y={grip.point.y - 4} width="8" height="8" />
        {/each}
        {#each selection.rotate as zone (zone.corner)}
          <circle class="draw-rotate" cx={zone.point.x} cy={zone.point.y} r="4.5" />
        {/each}
      {/if}
      {#if brush}
        <rect class="draw-brush" x={brush.x} y={brush.y} width={brush.w} height={brush.h} />
      {/if}
    </g>
  </svg>

  {#if editingId}
    <TextEditor {editor} id={editingId} />
  {/if}
</div>

<style>
  .draw-root {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--draw-canvas);
    color: var(--draw-fg);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    outline: none;
  }

  .draw-svg {
    position: absolute;
    inset: 0;
    display: block;
  }

  .draw-node-fo {
    overflow: visible;
    /* The select tool owns every pointer event, inner node controls wait. */
    pointer-events: none;
  }

  .draw-node-html {
    width: 100%;
    height: 100%;
  }

  .draw-selection {
    fill: none;
    stroke: var(--draw-accent);
    stroke-width: 1.5;
  }

  .draw-grip {
    fill: var(--draw-bg);
    stroke: var(--draw-accent);
    stroke-width: 1.5;
  }

  .draw-rotate {
    fill: var(--draw-bg);
    stroke: var(--draw-accent);
    stroke-width: 1.5;
  }

  .draw-hover {
    fill: none;
    stroke: var(--draw-accent);
    stroke-width: 1;
    opacity: 0.6;
  }

  .draw-guide {
    stroke: #e8590c;
    stroke-width: 1;
  }

  .draw-brush {
    fill: color-mix(in srgb, var(--draw-accent) 15%, transparent);
    stroke: var(--draw-accent);
    stroke-width: 1;
  }
</style>

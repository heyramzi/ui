<script lang="ts">
  import type { Editor } from "./core";
  import { trackEditor } from "./runes/useEditor.svelte";

  let { editor, dark = false }: { editor: Editor; dark?: boolean } = $props();

  const tracker = trackEditor(editor);

  type ToolButton = { id: string; label: string; icon: string };

  const svg = (body: string): string =>
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

  const TOOLS: ToolButton[] = [
    { id: "select", label: "Select", icon: svg('<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51z"/>') },
    {
      id: "hand",
      label: "Hand",
      icon: svg(
        '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'
      ),
    },
    {
      id: "pen",
      label: "Pen",
      icon: svg(
        '<path d="M12 19l7-7 3 3-7 7z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18z"/><path d="M2 2l7.59 7.59"/><circle cx="11" cy="11" r="2"/>'
      ),
    },
    { id: "rect", label: "Rectangle", icon: svg('<rect x="4" y="5" width="16" height="14" rx="2"/>') },
    { id: "ellipse", label: "Ellipse", icon: svg('<ellipse cx="12" cy="12" rx="9" ry="7"/>') },
    { id: "diamond", label: "Diamond", icon: svg('<path d="M12 3l9 9-9 9-9-9z"/>') },
    { id: "line", label: "Line", icon: svg('<path d="M4 20L20 4"/>') },
    { id: "arrow", label: "Arrow", icon: svg('<path d="M4 20L20 4"/><path d="M13 4h7v7"/>') },
    {
      id: "text",
      label: "Text",
      icon: svg('<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>'),
    },
    {
      id: "eraser",
      label: "Eraser",
      icon: svg(
        '<path d="M4 20h16"/><path d="M8.5 16.5l-3-3a2 2 0 0 1 0-2.8l6.2-6.2a2 2 0 0 1 2.8 0l3 3a2 2 0 0 1 0 2.8l-6.2 6.2a2 2 0 0 1-2.8 0z"/><path d="M11 9l4 4"/>'
      ),
    },
    {
      id: "note",
      label: "Note",
      icon: svg('<path d="M5 4h11l3 3v13H5z"/><path d="M16 4v3h3"/>'),
    },
    { id: "frame", label: "Frame", icon: svg('<path d="M5 3v18M19 3v18M3 5h18M3 19h18"/>') },
  ];

  const UNDO_ICON = svg('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>');
  const REDO_ICON = svg('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>');

  const active = $derived.by(() => {
    tracker.version;
    return editor.getActivePath().split(".")[0];
  });
</script>

<div
  class="draw-toolbar"
  class:draw-dark={dark}
  style:--draw-bg={dark ? "#1a1a1a" : "#ffffff"}
  style:--draw-fg={dark ? "#f1f3f5" : "#1e1e1e"}
  style:--draw-accent={dark ? "#74c0fc" : "#2f6feb"}
  role="toolbar"
  aria-label="Tools"
>
  {#each TOOLS as tool (tool.id)}
    <button
      type="button"
      title={tool.label}
      aria-label={tool.label}
      aria-pressed={active === tool.id}
      onclick={() => editor.setTool(tool.id)}
    >
      {@html tool.icon}
    </button>
  {/each}

  <span class="draw-toolbar-sep" aria-hidden="true"></span>

  <button type="button" title="Undo" aria-label="Undo" onclick={() => editor.undo()}>
    {@html UNDO_ICON}
  </button>
  <button type="button" title="Redo" aria-label="Redo" onclick={() => editor.redo()}>
    {@html REDO_ICON}
  </button>
</div>

<style>
  .draw-toolbar {
    position: absolute;
    left: 50%;
    bottom: 16px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--draw-fg) 14%, transparent);
    background: var(--draw-bg);
    color: var(--draw-fg);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
    font-family: sans-serif;
  }

  .draw-toolbar button {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .draw-toolbar button:hover {
    background: color-mix(in srgb, var(--draw-fg) 10%, transparent);
  }

  .draw-toolbar button[aria-pressed="true"] {
    background: var(--draw-accent);
    color: #ffffff;
  }

  .draw-toolbar button :global(svg) {
    display: block;
  }

  .draw-toolbar-sep {
    width: 1px;
    height: 22px;
    margin: 0 4px;
    background: color-mix(in srgb, var(--draw-fg) 16%, transparent);
  }
</style>

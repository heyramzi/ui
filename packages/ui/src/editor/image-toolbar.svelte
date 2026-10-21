<script lang="ts">
// =========================
// IMPORTS
// =========================
import { Trash, TextAlignLeft, TextAlignCenter, TextAlignRight } from "phosphor-svelte";

// =========================
// TYPES
// =========================
interface Props {
	pos: { top: number; left: number };
	onalign: (align: "left" | "center" | "right") => void;
	ondelete: () => void;
}

// =========================
// PROPS
// =========================
let { pos, onalign, ondelete }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class="image-toolbar"
	style="top: {pos.top}px; left: {pos.left}px;"
	role="toolbar"
>
	<button
		type="button"
		class="image-toolbar-btn"
		title="Align left"
		onclick={() => onalign("left")}
	>
		<TextAlignLeft size={14} />
	</button>
	<button
		type="button"
		class="image-toolbar-btn"
		title="Align center"
		onclick={() => onalign("center")}
	>
		<TextAlignCenter size={14} />
	</button>
	<button
		type="button"
		class="image-toolbar-btn"
		title="Align right"
		onclick={() => onalign("right")}
	>
		<TextAlignRight size={14} />
	</button>
	<div class="image-toolbar-divider"></div>
	<button
		type="button"
		class="image-toolbar-btn destructive"
		title="Delete image"
		onclick={ondelete}
	>
		<Trash size={14} />
	</button>
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* ---- IMAGE TOOLBAR ---- */
	.image-toolbar {
		position: absolute;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 1px;
		padding: 3px;
		background: var(--color-popover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--elev-raised);
		animation: slash-enter var(--duration-fast) var(--ease-out);
	}

	.image-toolbar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-muted-foreground);
		cursor: pointer;
		transition: opacity var(--duration-quick) var(--ease-smooth-out), transform var(--duration-quick) var(--ease-smooth-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.image-toolbar-btn:hover {
			background: var(--color-accent);
			color: var(--color-foreground);
		}

		.image-toolbar-btn.destructive:hover {
			background: oklch(from var(--color-error) l c h / 0.1);
			color: var(--color-error);
		}
	}

	.image-toolbar-divider {
		width: 1px;
		height: 1rem;
		background: var(--color-border);
		margin: 0 2px;
		opacity: 0.6;
	}

	@media (prefers-reduced-motion: reduce) {
		.image-toolbar {
			animation: none;
		}
	}
</style>

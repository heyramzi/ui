<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { SlashItem } from "./slash-items.js";

// =========================
// TYPES
// =========================
interface Props {
	items: SlashItem[];
	pos: { top: number; left: number };
	selectedIndex: number;
	/** The menu element, so the parent can close it on an outside click. */
	el?: HTMLDivElement;
	onselect: (item: SlashItem) => void;
}

// =========================
// PROPS
// =========================
let { items, pos, selectedIndex = $bindable(), el = $bindable(), onselect }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	bind:this={el}
	class="slash-menu"
	style="top: {pos.top}px; left: {pos.left}px;"
	role="listbox"
>
	{#each items as item, i}
		<button
			type="button"
			class="slash-item"
			class:selected={i === selectedIndex}
			onclick={() => onselect(item)}
			onpointerenter={() => selectedIndex = i}
			role="option"
			aria-selected={i === selectedIndex}
		>
			<span class="slash-icon">
				<item.icon size={18} />
			</span>
			<span class="slash-text">
				<span class="slash-label">{item.label}</span>
				<span class="slash-desc">{item.description}</span>
			</span>
		</button>
	{/each}
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	/* ---- SLASH COMMAND MENU ---- */
	.slash-menu {
		position: absolute;
		z-index: 50;
		min-width: 260px;
		max-height: 340px;
		overflow-y: auto;
		padding: 6px;
		background: var(--color-popover);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-xl);
		box-shadow: var(--elev-overlay);
		animation: slash-enter var(--duration-fast) var(--ease-out);
	}

	@keyframes slash-enter {
		from {
			opacity: 0;
			transform: translateY(-3px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.slash-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.5rem 0.625rem;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		color: var(--color-foreground);
		cursor: pointer;
		text-align: left;
		transition: background-color var(--duration-micro) var(--ease-smooth-out);
	}

	.slash-item:hover,
	.slash-item.selected {
		background: var(--color-accent);
	}

	.slash-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--radius-sm);
		background: var(--color-muted);
		color: var(--color-muted-foreground);
		flex-shrink: 0;
		transition: background-color var(--duration-micro) var(--ease-smooth-out), color var(--duration-micro) var(--ease-smooth-out);
	}

	.slash-item.selected .slash-icon,
	.slash-item:hover .slash-icon {
		background: oklch(from var(--color-brand-indigo) l c h / 0.1);
		color: var(--color-brand-indigo);
	}

	.slash-text {
		display: flex;
		flex-direction: column;
		gap: 0;
		min-width: 0;
	}

	.slash-label {
		font-size: 0.8125rem;
		font-weight: 500;
		line-height: 1.3;
	}

	.slash-desc {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
		line-height: 1.3;
	}

	@media (prefers-reduced-motion: reduce) {
		.slash-menu {
			animation: none;
		}
	}
</style>

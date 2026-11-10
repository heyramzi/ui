<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Toolbar } from "bits-ui";
	import * as Popover from "#src/shadcn/popover/index.js";
	import * as Tooltip from "#src/shadcn/tooltip/index.js";
	import { Trash, TextAlignLeft, TextAlignCenter, TextAlignRight } from "phosphor-svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** The image the toolbar floats over. */
		anchor: HTMLElement | null;
		open: boolean;
		onAlign: (align: "left" | "center" | "right") => void;
		onDelete: () => void;
	}

	type Tool = {
		label: string;
		icon: typeof Trash;
		destructive?: boolean;
		run: () => void;
	};

	// =========================
	// PROPS
	// =========================
	let { anchor, open = $bindable(), onAlign, onDelete }: Props = $props();

	// =========================
	// CONSTANTS
	// =========================
	const ALIGN: Tool[] = [
		{ label: "Align left", icon: TextAlignLeft, run: () => onAlign("left") },
		{ label: "Align center", icon: TextAlignCenter, run: () => onAlign("center") },
		{ label: "Align right", icon: TextAlignRight, run: () => onAlign("right") },
	];

	// =========================
	// STATE
	// =========================
	let content = $state<HTMLElement | null>(null);

	// =========================
	// FUNCTIONS
	// =========================
	/** Esc from inside the toolbar goes back to the text, which still holds the image selected. */
	function returnToText(e: Event) {
		e.preventDefault();
		const active = document.activeElement;
		if (!active || active === document.body || content?.contains(active)) {
			anchor?.closest<HTMLElement>("[contenteditable='true']")?.focus();
		}
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet tool(t: Tool)}
	<Tooltip.Root>
		<Tooltip.Trigger aria-label={t.label} onclick={t.run}>
			{#snippet child({ props: trigger })}
				<Toolbar.Button {...trigger}>
					{#snippet child({ props })}
						<button {...props} class="image-toolbar-btn" class:destructive={t.destructive}>
							<t.icon aria-hidden="true" size={14} />
						</button>
					{/snippet}
				</Toolbar.Button>
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content>{t.label}</Tooltip.Content>
	</Tooltip.Root>
{/snippet}

<!-- Not portaled, so Tab from the text reaches it next. Focus stays in the text when it opens. -->
<Popover.Root bind:open>
	<Popover.Content
		bind:ref={content}
		customAnchor={anchor}
		side="top"
		sideOffset={4}
		trapFocus={false}
		portalProps={{ disabled: true }}
		onOpenAutoFocus={(e) => e.preventDefault()}
		onCloseAutoFocus={returnToText}
	>
		{#snippet child({ props, wrapperProps })}
			<div {...wrapperProps}>
				<!-- Esc closes the toolbar itself here; left to Bits, the first one only shuts the tooltip. -->
				<Toolbar.Root
					{...props}
					aria-label="Image"
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === "Escape") open = false;
					}}
				>
					{#snippet child({ props: root })}
						<Tooltip.Provider>
							<div {...root} class="image-toolbar">
								{#each ALIGN as t (t.label)}
									{@render tool(t)}
								{/each}
								<div class="image-toolbar-divider"></div>
								{@render tool({
									label: "Delete image",
									icon: Trash,
									destructive: true,
									run: onDelete,
								})}
							</div>
						</Tooltip.Provider>
					{/snippet}
				</Toolbar.Root>
			</div>
		{/snippet}
	</Popover.Content>
</Popover.Root>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	@layer theme, base, components, utilities;

	@layer components {
		/* ---- IMAGE TOOLBAR ---- */
		.image-toolbar {
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
			transition:
				opacity var(--duration-quick) var(--ease-smooth-out),
				transform var(--duration-quick) var(--ease-smooth-out);
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
	}

	/* Svelte scopes keyframes per component, so slash-menu's copy never reached this toolbar. */
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
</style>

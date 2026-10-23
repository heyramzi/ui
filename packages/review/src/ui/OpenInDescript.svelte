<script lang="ts">
	import Icon from "#src/components/icons/Icon.svelte";

	type Target = "app" | "web";

	let { links }: { links: { web: string; app: string } } = $props();

	// WHY the same key as the shelf: both pages share one origin, so a choice made on a card is the one this button opens.
	const KEY = "editor-os.descript-open";
	// WHY: a phone has no Descript app to hand the link to, so the app row would be a dead end there.
	const canApp =
		typeof matchMedia === "function" ? matchMedia("(any-pointer: fine)").matches : true;

	function remembered(): Target {
		try {
			const saved = localStorage.getItem(KEY);
			if (saved === "web" || (saved === "app" && canApp)) return saved;
		} catch {
			/* storage can be blocked; the default stands */
		}
		return canApp ? "app" : "web";
	}

	let target = $state<Target>(remembered());
	let open = $state(false);
	let wrap = $state<HTMLElement>();

	const rows: { id: Target; label: string; note: string }[] = [
		{ id: "app", label: "Descript app", note: "Opens on this computer" },
		{ id: "web", label: "Descript in the browser", note: "web.descript.com" },
	];
	const visible = $derived(rows.filter((row) => row.id === "web" || canApp));
	const current = $derived(target === "app" && canApp ? "app" : "web");
	const label = $derived(current === "app" ? "Open in Descript app" : "Open in Descript web");

	function choose(next: Target): void {
		target = next;
		open = false;
		try {
			localStorage.setItem(KEY, next);
		} catch {
			/* the choice just isn't remembered */
		}
	}

	function toggle(): void {
		open = !open;
		if (open) queueMicrotask(() => wrap?.querySelector<HTMLElement>("[role=menuitem]")?.focus());
	}

	function keys(event: KeyboardEvent): void {
		if (event.key === "Escape" && open) {
			event.stopPropagation();
			open = false;
			wrap?.querySelector<HTMLElement>(".more")?.focus();
			return;
		}
		if (!open || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
		event.preventDefault();
		const items = [...(wrap?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
		const at = items.indexOf(document.activeElement as HTMLElement);
		const step = event.key === "ArrowDown" ? 1 : -1;
		items[(at + step + items.length) % items.length]?.focus();
	}

	$effect(() => {
		if (!open) return;
		const away = (event: PointerEvent) => {
			if (event.target instanceof Node && !wrap?.contains(event.target)) open = false;
		};
		document.addEventListener("pointerdown", away);
		return () => document.removeEventListener("pointerdown", away);
	});
</script>

<div class="wrap" class:solo={!canApp} bind:this={wrap} onkeydown={keys} role="presentation">
	<div class="split">
		<a
			class="btn solid main"
			href={links[current]}
			target={current === "web" ? "_blank" : undefined}
			rel={current === "web" ? "noopener" : undefined}
			aria-label={label}
			data-tip={label}
			onclick={() => choose(current)}
		>
			<Icon name="external" /><span class="words">Open in Descript</span>
		</a>
		<button
			class="btn solid more"
			aria-label="Choose where Descript opens"
			aria-haspopup="menu"
			aria-expanded={open}
			onclick={toggle}
		>
			<span class="chev"><Icon name="chevron" small /></span>
		</button>
	</div>
	<div class="pop" data-open={open} role="menu" aria-label="Open in Descript" inert={!open}>
		{#each visible as row (row.id)}
			<a
				class="item"
				role="menuitem"
				href={links[row.id]}
				target={row.id === "web" ? "_blank" : undefined}
				rel={row.id === "web" ? "noopener" : undefined}
				onclick={() => choose(row.id)}
			>
				<span class="text">
					<span class="name">{row.label}</span>
					<span class="note">{row.note}</span>
				</span>
				<span class="mark"
					>{#if row.id === current}<Icon name="check" small />{/if}</span
				>
			</a>
		{/each}
	</div>
</div>

<style>
	.wrap {
		position: relative;
		margin-right: 4px;
	}
	.split {
		display: inline-flex;
	}
	/* One control: the two halves share a seam and the outer corners keep the button radius. */
	.main {
		border-top-right-radius: 0;
		border-bottom-right-radius: 0;
		text-decoration: none;
	}
	/* A phone has one place to open it, so the menu half goes and the button keeps its full radius. */
	.solo .main {
		border-radius: var(--radius-sm);
	}
	.solo .more {
		display: none;
	}
	.more {
		width: var(--control);
		padding: 0;
		border-left-color: var(--line-soft);
		border-top-left-radius: 0;
		border-bottom-left-radius: 0;
	}
	.chev {
		display: grid;
		transform: rotate(90deg);
	}
	.more[aria-expanded="true"] {
		color: var(--text);
		background: var(--press);
	}
	.pop {
		position: absolute;
		z-index: 50;
		top: calc(100% + 8px);
		right: 0;
		width: min(264px, calc(100vw - 2 * var(--gutter)));
		padding: 4px;
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-pop);
		transform-origin: top right;
		opacity: 0;
		visibility: hidden;
		transform: scale(var(--scale-tiny));
		transition:
			opacity var(--dropdown-close-dur) var(--ease-smooth-out),
			transform var(--dropdown-close-dur) var(--ease-smooth-out),
			visibility 0s linear var(--dropdown-close-dur);
	}
	.pop[data-open="true"] {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition:
			opacity var(--dropdown-open-dur) var(--ease-smooth-out),
			transform var(--dropdown-open-dur) var(--ease-smooth-out),
			visibility 0s;
	}
	@starting-style {
		.pop[data-open="true"] {
			opacity: 0;
			transform: scale(var(--dropdown-pre-scale));
		}
	}
	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 44px;
		padding: 6px 10px;
		border-radius: var(--radius);
		color: var(--text);
		text-decoration: none;
		transition: background-color var(--duration-quick) var(--ease-smooth-out);
	}
	.item:hover,
	.item:focus-visible {
		background: var(--hover);
	}
	.item:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}
	.text {
		display: grid;
		gap: 3px;
		min-width: 0;
	}
	.name {
		font-size: var(--fs-sm);
		font-weight: 600;
	}
	.note {
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.mark {
		display: grid;
		width: 16px;
		flex: none;
		color: var(--accent);
	}
	@media (max-width: 1040px) {
		.words {
			display: none;
		}
		.main {
			width: var(--control);
			padding: 0;
		}
	}
	@media (pointer: coarse) {
		.more {
			width: 40px;
		}
		.main {
			min-width: 40px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pop,
		.item {
			transition: none;
		}
	}
</style>

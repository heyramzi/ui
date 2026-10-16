<script lang="ts">
	import type { Picker } from "#src/hooks/picker.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import LayoutDiagram from "#src/diagrams/LayoutDiagram.svelte";
	import { mediaKind, shelfIcon } from "#src/ui/media.js";

	let { picker }: { picker: Picker } = $props();
	let list = $state<HTMLElement>();
	let menu = $state<HTMLElement>();
	/** The layout under the pointer or the arrow keys, drawn large beside the menu. */
	const peek = $derived(picker.items[picker.index]?.item);
	/** Fixed to the window and moved to the body, since the side panel clips anything outside it. */
	let peekAt = $state<{ right: number; bottom: number }>();
	const toBody = (node: HTMLElement) => {
		document.body.append(node);
		return () => node.remove();
	};

	$effect(() => {
		void peek;
		const box = menu?.getBoundingClientRect();
		peekAt = box
			? { right: window.innerWidth - box.left + 10, bottom: window.innerHeight - box.bottom }
			: undefined;
	});

	$effect(() => {
		void picker.index;
		// WHY: scrollIntoView also scrolls the clipped panel sideways, so only the list itself moves.
		const on = list?.querySelector<HTMLElement>('[aria-selected="true"]');
		if (!list || !on) return;
		if (on.offsetTop < list.scrollTop) list.scrollTop = on.offsetTop - 24;
		else if (on.offsetTop + on.offsetHeight > list.scrollTop + list.clientHeight)
			list.scrollTop = on.offsetTop + on.offsetHeight - list.clientHeight + 4;
	});
</script>

{#if picker.open}
	<div class="menu" bind:this={menu}>
		{#if picker.tabs.length > 1}
			<div class="tabs" role="tablist" aria-label="Shelves">
				{#each [{ id: "all", label: "All" }, ...picker.tabs] as tab (tab.id)}
					<button
						class="tab"
						role="tab"
						aria-selected={picker.tab === tab.id}
						onmousedown={(e) => {
							e.preventDefault();
							picker.show(tab.id);
						}}
						>{#if tab.id !== "all"}<Icon name={shelfIcon(tab.id)} small />{/if}{tab.label}</button
					>
				{/each}
				<span class="hint">&larr; &rarr;</span>
			</div>
		{/if}
		<div class="list" id={picker.id} role="listbox" aria-label="Library" bind:this={list}>
			{#each picker.items as pick, i (pick.shelf.id + pick.item.id)}
				{@const on = i === picker.index}
				{@const src = pick.item.src}
				{@const kind = src ? mediaKind(src) : undefined}
				{@const preview = pick.item.preview}
				{#if picker.tab === "all" && (i === 0 || picker.items[i - 1]?.shelf.id !== pick.shelf.id)}
					<h6 class="head" role="presentation">{pick.shelf.label}</h6>
				{/if}
				<div
					class="opt"
					id="{picker.id}-{i}"
					role="option"
					tabindex="-1"
					aria-selected={on}
					onmousedown={(e) => {
						e.preventDefault();
						picker.pick(i);
					}}
					onmousemove={() => picker.index !== i && (picker.index = i)}
				>
					<span
						class="thumb"
						class:diagram={!!preview}
						style:aspect-ratio={preview ? `${preview.w} / ${preview.h}` : undefined}
					>
						{#if preview}
							<LayoutDiagram w={preview.w} h={preview.h} boxes={preview.boxes} label="" />
						{:else if src && kind === "image"}
							<img {src} alt="" loading="lazy" />
						{:else if src && kind === "video" && on}
							<!-- svelte-ignore a11y_media_has_caption -->
							<video src="{src}#t=0.8" autoplay muted loop playsinline preload="metadata"></video>
						{:else}
							<Icon name={shelfIcon(pick.shelf.id)} />
						{/if}
					</span>
					<span class="words">
						<b>{pick.item.name}</b>
						<small>{pick.item.meta ?? pick.item.id}</small>
					</span>
				</div>
			{/each}
		</div>
	</div>
	{#if peek?.preview && peekAt}
		{@const preview = peek.preview}
		<figure
			class="peek"
			class:portrait={preview.h > preview.w}
			style:aspect-ratio="{preview.w} / {preview.h}"
			style:right="{peekAt.right}px"
			style:bottom="{peekAt.bottom}px"
			aria-hidden="true"
			{@attach toBody}
		>
			<LayoutDiagram w={preview.w} h={preview.h} boxes={preview.boxes} label={peek.name} />
		</figure>
	{/if}
{/if}

<style>
	.menu {
		position: absolute;
		z-index: 30;
		inset: auto 0 calc(100% + 6px);
		display: flex;
		flex-direction: column;
		max-height: min(360px, 55dvh);
		overflow: hidden;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow-pop);
		transform-origin: bottom center;
		animation: menu-in var(--dropdown-open-dur) var(--ease-smooth-out) both;
	}
	@keyframes menu-in {
		from {
			opacity: 0;
			scale: var(--dropdown-pre-scale);
		}
	}
	.tabs {
		display: flex;
		flex: none;
		align-items: center;
		gap: 2px;
		padding: 6px 6px 5px;
		border-bottom: 1px solid var(--line-soft);
		overflow-x: auto;
	}
	.tab {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		min-height: 26px;
		padding: 0 9px;
		border-radius: var(--radius-sm);
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
		white-space: nowrap;
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			color var(--duration-quick) var(--ease-smooth-out);
	}
	.tab:hover {
		color: var(--text);
	}
	.tab[aria-selected="true"] {
		background: var(--raised);
		color: var(--text);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.hint {
		margin-left: auto;
		padding-right: 4px;
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.list {
		min-height: 0;
		overflow-y: auto;
		padding: 4px;
	}
	.head {
		margin: 6px 8px 2px;
		color: var(--faint);
		font-size: var(--fs-xs);
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.head:first-child {
		margin-top: 2px;
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 5px 6px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: background-color var(--duration-micro) var(--ease-smooth-out);
	}
	.opt[aria-selected="true"] {
		background: var(--accent-soft);
	}
	.thumb {
		display: grid;
		flex: none;
		place-items: center;
		width: 44px;
		aspect-ratio: 16 / 10;
		overflow: hidden;
		border-radius: var(--radius-xs);
		background: var(--ground);
		box-shadow: inset 0 0 0 1px var(--line-soft);
		color: var(--faint);
	}
	.thumb img,
	.thumb video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	/* A layout keeps its own shape, so a 9:16 card reads as tall. */
	.thumb.diagram {
		width: auto;
		height: 48px;
		max-width: 72px;
		background: none;
		box-shadow: none;
	}
	.thumb.diagram :global(svg),
	.peek :global(svg) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.peek {
		position: fixed;
		z-index: 40;
		width: 340px;
		margin: 0;
		padding: 10px;
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow-pop);
		animation: menu-in var(--dropdown-open-dur) var(--ease-smooth-out) both;
	}
	.peek.portrait {
		width: 200px;
	}
	@media (max-width: 900px) {
		.peek {
			display: none;
		}
	}
	.words {
		display: grid;
		min-width: 0;
		line-height: 1.3;
	}
	.words b {
		overflow: hidden;
		font-size: var(--fs-sm);
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.words small {
		overflow: hidden;
		color: var(--dim);
		font-size: var(--fs-xs);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

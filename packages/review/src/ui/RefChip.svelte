<script lang="ts">
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import { mediaKind, shelfIcon } from "#src/ui/media.js";

	let { shelf, id }: { shelf: string; id: string } = $props();
	const app = useApp();
	const found = $derived(app.library.find(shelf, id));
	const src = $derived(found?.item.src);
	const kind = $derived(src ? mediaKind(src) : undefined);

	let chip = $state<HTMLElement>();
	let card = $state<HTMLElement>();
	let hover = $state(false);

	// WHY: the card sits in the top layer, so no scroll list or clip can cut it off.
	function place() {
		if (!chip || !card) return;
		const box = chip.getBoundingClientRect();
		const width = card.offsetWidth;
		card.style.left = `${Math.min(Math.max(box.left + box.width / 2 - width / 2, 8), innerWidth - width - 8)}px`;
		const above = box.top - card.offsetHeight - 8;
		card.style.top = `${above < 8 ? box.bottom + 8 : above}px`;
	}
	$effect(() => {
		if (!card) return;
		if (hover) {
			card.showPopover();
			place();
		} else if (card.matches(":popover-open")) card.hidePopover();
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span
	class="ref"
	class:gone={!found}
	class:live={!!src}
	bind:this={chip}
	role={src ? "button" : undefined}
	tabindex={src ? 0 : undefined}
	title={found ? undefined : "Not in the library any more"}
	aria-label="{shelf}: {found?.item.name ?? id}"
	onpointerenter={() => src && (hover = true)}
	onpointerleave={() => (hover = false)}
	onfocus={() => src && (hover = true)}
	onblur={() => (hover = false)}
>
	<Icon name={shelfIcon(shelf)} small />{found?.item.name ?? id}
</span>
{#if src}
	<span class="card" popover="manual" bind:this={card}>
		{#if hover}
			{#if kind === "image"}
				<img {src} alt="" />
			{:else if kind === "video"}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src="{src}#t=0.8" autoplay muted loop playsinline></video>
			{/if}
			<span class="cap"
				>{found?.item.name}<small>{found?.item.meta ?? found?.shelf.label}</small></span
			>
		{/if}
	</span>
{/if}

<style>
	.ref {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin: 0 1px;
		padding: 0 6px 0 4px;
		border-radius: var(--radius-sm);
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px var(--accent-line);
		color: var(--text);
		font-size: var(--fs-xs);
		font-weight: 600;
		line-height: 1.6;
		vertical-align: baseline;
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			box-shadow var(--duration-quick) var(--ease-smooth-out);
	}
	.ref :global(.ic) {
		color: var(--accent);
	}
	.ref.live {
		cursor: help;
	}
	.ref.live:hover,
	.ref.live:focus-visible {
		background: color-mix(in oklab, var(--accent) 24%, var(--surface));
		box-shadow: inset 0 0 0 1px var(--accent);
	}
	.ref.gone {
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--dim);
		font-weight: 500;
	}
	.ref.gone :global(.ic) {
		color: var(--faint);
	}
	.card {
		position: fixed;
		inset: auto;
		width: 200px;
		margin: 0;
		padding: 6px;
		border: 0;
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--shadow-pop);
		pointer-events: none;
		animation: card-in var(--tt-in-dur) var(--ease-out) both;
	}
	@keyframes card-in {
		from {
			opacity: 0;
			scale: var(--tt-scale);
		}
	}
	.card img,
	.card video {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-sm);
		background: var(--ground);
		object-fit: cover;
	}
	.cap {
		display: grid;
		padding: 6px 2px 0;
		font-size: var(--fs-xs);
		font-weight: 600;
		line-height: 1.3;
	}
	.card small {
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 400;
	}
</style>

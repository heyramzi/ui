<script lang="ts">
	import type { BeatKind, BeatOption } from "#src/core/types.js";
	import { clock } from "#src/core/format.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import LayoutDiagram from "#src/diagrams/LayoutDiagram.svelte";
	import { claim } from "#src/ui/media.js";

	let {
		option,
		pending,
		kind,
		autoplay = false,
	}: {
		option: BeatOption | undefined;
		pending?: string;
		kind?: BeatKind;
		autoplay?: boolean;
	} = $props();

	let el = $state<HTMLMediaElement>();
	let playing = $state(false);
	let time = $state(0);
	let length = $state(0);
	let big = $state<HTMLElement>();
	let bigOpen = $state(false);
	const canOpen = $derived(
		!!option?.src &&
			(option.kind === "video" || option.kind === "audio" || option.kind === "image"),
	);

	function openLarge() {
		el?.pause();
		bigOpen = true;
		big?.showPopover();
	}

	function toggle() {
		if (!el) return;
		if (el.paused) {
			claim(el);
			void el.play().catch(() => undefined);
		} else el.pause();
	}
	function claimOnMount(node: HTMLMediaElement) {
		claim(node);
	}
	// WHY: a new option is a new clip, so the old one's clock and play state go.
	$effect(() => {
		void option?.id;
		playing = false;
		time = 0;
		length = 0;
	});
	// WHY: a hover peek is for seeing the motion at a glance, so a muted video starts by itself and stops when the peek closes.
	$effect(() => {
		const video = el;
		if (!autoplay || !video || option?.kind !== "video") return;
		claim(video);
		void video.play().catch(() => undefined);
		return () => video.pause();
	});
</script>

<div class="preview" class:alpha={option?.alpha} data-kind={option?.kind ?? "none"}>
	{#if !option}
		<div class="hold">
			<Icon name={kind?.icon ?? "video"} />
			<span class:skel={!!pending}>{pending ?? "Nothing here yet"}</span>
		</div>
	{:else if option.kind === "layout" && option.preview}
		<LayoutDiagram
			w={option.preview.w}
			h={option.preview.h}
			boxes={option.preview.boxes}
			label={option.name}
		/>
	{:else if option.kind === "image" && option.src}
		<img src={option.src} alt={option.name} loading="lazy" />
	{:else if (option.kind === "video" || option.kind === "audio") && option.src}
		{#key option.src}
			{#if option.kind === "video"}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					bind:this={el}
					src="{option.src}#t=0.1"
					preload="metadata"
					muted
					loop
					playsinline
					onplay={() => (playing = true)}
					onpause={() => (playing = false)}
					ontimeupdate={() => (time = el?.currentTime ?? 0)}
					onloadedmetadata={() => (length = el?.duration ?? 0)}
				></video>
			{:else}
				<audio
					bind:this={el}
					src={option.src}
					preload="metadata"
					onplay={() => (playing = true)}
					onpause={() => (playing = false)}
					ontimeupdate={() => (time = el?.currentTime ?? 0)}
					onloadedmetadata={() => (length = el?.duration ?? 0)}
				></audio>
				<div class="wave"><Icon name={kind?.icon ?? "sound"} /></div>
			{/if}
		{/key}
		<button
			class="play"
			class:on={playing}
			aria-label={playing ? "Pause" : "Play"}
			onclick={toggle}
		>
			<span class="disc"><Icon name={playing ? "pause" : "play"} /></span>
		</button>
		<div class="bar" aria-hidden="true">
			<i style:width="{length ? (time / length) * 100 : 0}%"></i>
		</div>
		{#if length}<span class="clock num">{clock(playing || time > 0 ? time : length)}</span>{/if}
	{:else}
		<div class="hold"><Icon name={kind?.icon ?? "video"} /><span>{option.name}</span></div>
	{/if}
	{#if option?.alpha}<span class="tab">Transparent</span>{/if}
	{#if canOpen}
		<button class="expand" aria-label="Open larger" data-tip="Open larger" onclick={openLarge}>
			<Icon name="expand" small />
		</button>
	{/if}
</div>

{#if canOpen && option}
	<!-- WHY: the card preview is small on purpose, so the popover is where a clip gets a proper look. -->
	<div
		class="big"
		class:alpha={option.alpha}
		popover="auto"
		bind:this={big}
		ontoggle={(e) => (bigOpen = e.newState === "open")}
	>
		{#if bigOpen}
			{#if option.kind === "image"}
				<img src={option.src} alt={option.name} />
			{:else if option.kind === "video"}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src={option.src} controls autoplay loop playsinline use:claimOnMount></video>
			{:else}
				<audio src={option.src} controls autoplay use:claimOnMount></audio>
			{/if}
			{#if option.alpha}<span class="tab">Transparent</span>{/if}
		{/if}
	</div>
{/if}

<style>
	.preview {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: var(--radius-sm);
		background: var(--ground);
		box-shadow: inset 0 0 0 1px var(--line-soft);
	}
	.preview.alpha,
	.big.alpha {
		background: repeating-conic-gradient(var(--line-soft) 0 25%, var(--ground) 0 50%) 0 0 / 12px
			12px;
	}
	.tab {
		position: absolute;
		top: 6px;
		left: 6px;
		padding: 2px 6px;
		border-radius: var(--radius-xs);
		background: color-mix(in oklab, var(--ground) 70%, transparent);
		color: var(--warn-text);
		font-size: var(--fs-xs);
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		pointer-events: none;
	}
	.expand {
		position: absolute;
		top: 6px;
		right: 6px;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-xs);
		background: color-mix(in oklab, var(--ground) 70%, transparent);
		color: var(--text);
		opacity: 0;
		transition: opacity var(--duration-quick) var(--ease-smooth-out);
	}
	.preview:hover .expand,
	.expand:focus-visible {
		opacity: 1;
	}
	/* WHY: the card clips overflow, so the tip opens to the button's left, inside the card. */
	.expand[data-tip]::after {
		top: 50%;
		right: calc(100% + 6px);
		left: auto;
		translate: 0 -50%;
		transform-origin: right center;
		white-space: nowrap;
	}
	@media (hover: none) {
		.expand {
			opacity: 1;
		}
	}
	.big {
		width: min(90vw, 1100px);
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--ground);
		color: var(--text);
		overflow: hidden;
	}
	.big:popover-open {
		position: fixed;
		inset: 0;
		margin: auto;
		height: fit-content;
	}
	.big::backdrop {
		background: color-mix(in oklab, black 60%, transparent);
	}
	.big video,
	.big img {
		display: block;
		width: 100%;
		max-height: 85vh;
	}
	.big audio {
		display: block;
		width: 100%;
	}
	video,
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.hold {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 12px;
		color: var(--faint);
		font-size: var(--fs-xs);
		text-align: center;
	}
	.hold :global(.ic) {
		width: 22px;
		height: 22px;
	}
	.hold .skel {
		padding: 3px 10px;
		color: var(--dim);
	}
	.wave {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		color: var(--faint);
		background: repeating-linear-gradient(90deg, var(--line-soft) 0 2px, transparent 2px 7px);
	}
	.wave :global(.ic) {
		width: 26px;
		height: 26px;
		color: var(--dim);
	}
	.play {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
	}
	.disc {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: color-mix(in oklab, var(--ground) 72%, transparent);
		color: var(--text);
		box-shadow: 0 0 0 1px var(--line);
		backdrop-filter: blur(var(--blur-small));
		transition:
			opacity var(--duration-fast) var(--ease-smooth-out),
			scale var(--duration-fast) var(--ease-out-quart),
			background-color var(--duration-quick) var(--ease-smooth-out);
	}
	.play:hover .disc {
		background: var(--accent);
		color: var(--on-accent);
		scale: 1.06;
	}
	.play:active .disc {
		scale: var(--scale-medium);
	}
	.play.on .disc {
		opacity: 0;
		scale: var(--scale-medium);
	}
	.preview:hover .play.on .disc,
	.play.on:focus-visible .disc {
		opacity: 1;
		scale: 1;
	}
	.bar {
		position: absolute;
		inset: auto 0 0;
		height: 3px;
		background: color-mix(in oklab, var(--text) 12%, transparent);
	}
	.bar i {
		display: block;
		height: 100%;
		background: var(--accent);
	}
	.clock {
		position: absolute;
		right: 6px;
		bottom: 8px;
		padding: 2px 5px;
		border-radius: var(--radius-xs);
		background: color-mix(in oklab, var(--ground) 70%, transparent);
		color: var(--text);
		font: 500 var(--fs-xs) / 1 var(--mono);
	}
</style>

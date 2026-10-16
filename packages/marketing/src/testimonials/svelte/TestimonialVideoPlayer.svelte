<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import Play from "phosphor-svelte/lib/Play";
	import Pause from "phosphor-svelte/lib/Pause";
	import ClosedCaptioning from "phosphor-svelte/lib/ClosedCaptioning";
	import { getEmbedUrl } from "#src/testimonials/embed.js";
	import { getMuxPlaybackId, getMuxPosterUrl } from "#src/testimonials/mux.js";
	import type { TestimonialCaption } from "#src/testimonials/svelte/types.js";

	// =========================
	// TYPES
	// =========================
	type Props = {
		src: string;
		caption?: TestimonialCaption | null;
		fit?: "cover" | "contain";
		rounded?: boolean;
		/** Browser controls on a file video, instead of the centred play button and caption toggle. */
		nativeControls?: boolean;
		/** Accessible name of the YouTube, Vimeo or Loom frame. */
		title?: string;
		class?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		src,
		caption = null,
		fit = "cover",
		rounded = true,
		nativeControls = false,
		title = "Video testimonial",
		class: extraClass = "",
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let videoEl = $state<HTMLVideoElement | null>(null);
	let playing = $state(false);
	let aspectRatio = $state<string | null>(null);
	let controlsVisible = $state(true);
	let captionsOn = $state(true);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	// =========================
	// DERIVED
	// =========================
	const muxPlaybackId = $derived(getMuxPlaybackId(src));
	const embedUrl = $derived(muxPlaybackId ? null : getEmbedUrl(src));

	// =========================
	// FUNCTIONS
	// =========================
	function scheduleHide() {
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			if (playing) controlsVisible = false;
		}, 2000);
	}

	function showControls() {
		controlsVisible = true;
		if (hideTimer) clearTimeout(hideTimer);
		if (playing) scheduleHide();
	}

	function togglePlay() {
		if (!videoEl) return;
		if (videoEl.paused) {
			videoEl.play();
			playing = true;
			scheduleHide();
		} else {
			videoEl.pause();
			playing = false;
			if (hideTimer) clearTimeout(hideTimer);
			controlsVisible = true;
		}
	}

	function setRatio(w: number, h: number) {
		if (w > 0 && h > 0) aspectRatio = `${w} / ${h}`;
	}

	function onLoadedMetadata() {
		if (!videoEl) return;
		const w = videoEl.videoWidth;
		const h = videoEl.videoHeight;
		setRatio(w, h);
		applyCaptionMode();
	}

	function applyCaptionMode() {
		if (!videoEl) return;
		const tracks = videoEl.textTracks;
		for (let i = 0; i < tracks.length; i += 1) {
			tracks[i].mode = captionsOn ? "showing" : "hidden";
		}
	}

	function toggleCaptions(event: MouseEvent) {
		event.stopPropagation();
		captionsOn = !captionsOn;
		applyCaptionMode();
	}

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		void captionsOn;
		void videoEl;
		applyCaptionMode();
	});

	/* WHY: mux-player is a ~200KB custom element, so it is pulled in only once a
	   Mux-backed testimonial is actually on the page. */
	$effect(() => {
		if (muxPlaybackId) import("@mux/mux-player").catch(() => {});
	});

	// Mux hides the video's size, but its poster keeps the recording's ratio.
	$effect(() => {
		const poster = getMuxPosterUrl(muxPlaybackId);
		if (!poster) return;
		const img = new Image();
		img.onload = () => setRatio(img.naturalWidth, img.naturalHeight);
		img.src = poster;
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	class={`group relative w-full overflow-hidden bg-black ${rounded ? "rounded-lg" : ""} ${extraClass}`}
	style={aspectRatio ? `aspect-ratio: ${aspectRatio};` : "aspect-ratio: 16 / 9;"}
	onmousemove={showControls}
	onmouseleave={() => playing && (controlsVisible = false)}
	role="presentation"
>
	{#if muxPlaybackId}
		<mux-player
			playback-id={muxPlaybackId}
			poster={getMuxPosterUrl(muxPlaybackId) ?? undefined}
			accent-color="white"
			stream-type="on-demand"
			class="testimonial-mux-player size-full"
		></mux-player>
	{:else if embedUrl}
		<iframe src={embedUrl} class="absolute inset-0 size-full" allowfullscreen {title}></iframe>
	{:else}
		<video
			bind:this={videoEl}
			{src}
			controls={nativeControls}
			class={`size-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
			preload="metadata"
			playsinline
			onloadedmetadata={onLoadedMetadata}
			onended={() => {
				playing = false;
				controlsVisible = true;
			}}
		>
			{#if caption}
				<track
					kind="captions"
					src={caption.src}
					srclang={caption.srclang}
					label={caption.label}
					default
				/>
			{:else}
				<track kind="captions" src="" srclang="en" label="Captions" default />
			{/if}
		</video>
		{#if !nativeControls}
			<button
				onclick={togglePlay}
				class={`absolute inset-0 flex cursor-pointer items-center justify-center border-none bg-transparent text-white transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
				aria-label={playing ? "Pause" : "Play"}
			>
				<span
					class="flex size-16 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm transition-colors group-hover:bg-black/75"
				>
					{#if playing}
						<Pause size={28} weight="fill" />
					{:else}
						<Play size={28} weight="fill" />
					{/if}
				</span>
			</button>
			{#if caption}
				<button
					onclick={toggleCaptions}
					class={`absolute bottom-2.5 right-2.5 flex size-7 cursor-pointer items-center justify-center rounded text-white backdrop-blur-sm transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"} ${captionsOn ? "border border-white/70 bg-white/20" : "border border-white/20 bg-black/55 hover:bg-black/75"}`}
					aria-label={captionsOn ? "Hide captions" : "Show captions"}
					aria-pressed={captionsOn}
					title={captionsOn ? "Hide captions" : "Show captions"}
				>
					<ClosedCaptioning size={14} weight={captionsOn ? "fill" : "regular"} />
				</button>
			{/if}
		{/if}
	{/if}
</div>

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	.group video::cue {
		font-size: 1rem;
		line-height: 1.4;
		background: rgba(0, 0, 0, 0.78);
		color: white;
		padding: 0.15em 0.4em;
	}
	@media (min-width: 768px) {
		.group video::cue {
			font-size: 1.15rem;
		}
	}

	:global(.testimonial-mux-player) {
		display: block;
		height: 100%;
		width: 100%;
		--controls-backdrop-color: rgba(0, 0, 0, 0.64);
	}
</style>

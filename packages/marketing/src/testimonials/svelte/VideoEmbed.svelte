<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import pauseIcon from "#src/testimonials/svelte/pause-icon.svg?raw";
	import playIcon from "#src/testimonials/svelte/play-icon.svg?raw";

	// =========================
	// PROPS
	// =========================
	let {
		url,
		rounded = true,
		playOnly = false,
	}: { url: string; rounded?: boolean; playOnly?: boolean } = $props();

	// =========================
	// STATE
	// =========================
	let videoEl = $state<HTMLVideoElement | null>(null);
	let playing = $state(false);

	// =========================
	// DERIVED
	// =========================
	const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".mov"];

	const isDirectVideo = $derived.by(() => {
		try {
			const { pathname } = new URL(url);
			return VIDEO_EXTENSIONS.some((ext) => pathname.toLowerCase().endsWith(ext));
		} catch {
			return false;
		}
	});

	const embedUrl = $derived.by(() => {
		if (isDirectVideo) return null;
		try {
			const parsed = new URL(url);

			if (parsed.hostname === "www.youtube.com" || parsed.hostname === "youtube.com") {
				if (parsed.pathname.startsWith("/embed/")) return url;
				const videoId = parsed.searchParams.get("v");
				if (videoId) return `https://www.youtube.com/embed/${videoId}`;
			}

			if (parsed.hostname === "youtu.be") {
				const videoId = parsed.pathname.slice(1);
				if (videoId) return `https://www.youtube.com/embed/${videoId}`;
			}

			if (parsed.hostname === "vimeo.com" || parsed.hostname === "www.vimeo.com") {
				const videoId = parsed.pathname.slice(1);
				if (videoId) return `https://player.vimeo.com/video/${videoId}`;
			}

			if (parsed.hostname === "www.loom.com" || parsed.hostname === "loom.com") {
				if (parsed.pathname.startsWith("/embed/")) return url;
				const match = parsed.pathname.match(/\/share\/([^?]+)/);
				if (match?.[1]) return `https://www.loom.com/embed/${match[1]}`;
			}

			return null;
		} catch {
			return null;
		}
	});

	const roundingClass = $derived(rounded ? "rounded-lg" : "");

	// =========================
	// FUNCTIONS
	// =========================
	function togglePlay() {
		if (!videoEl) return;
		if (videoEl.paused) {
			videoEl.play();
			playing = true;
		} else {
			videoEl.pause();
			playing = false;
		}
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if isDirectVideo}
	{#if playOnly}
		<div class="relative aspect-video w-full overflow-hidden {roundingClass}">
			<video
				bind:this={videoEl}
				src={url}
				class="size-full object-cover"
				preload="metadata"
				playsinline
				onended={() => (playing = false)}
			></video>
			<button onclick={togglePlay} class="play-btn" aria-label={playing ? "Pause" : "Play"}>
				{#if playing}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html pauseIcon}
				{:else}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html playIcon}
				{/if}
			</button>
		</div>
	{:else}
		<video
			src={url}
			class="aspect-video w-full object-cover {roundingClass}"
			controls
			preload="metadata"
			playsinline
		></video>
	{/if}
{:else if embedUrl}
	<div class="relative aspect-video w-full overflow-hidden {roundingClass}">
		<iframe
			src={embedUrl}
			class="absolute inset-0 size-full"
			allowfullscreen
			title="Video testimonial"
		></iframe>
	</div>
{/if}

<!-- =========================== -->
<!-- STYLE -->
<!-- =========================== -->
<style>
	.play-btn {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		cursor: pointer;
		color: white;
	}

	.play-btn::before {
		content: "";
		position: absolute;
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(4px);
		transition: background 0.15s ease;
	}

	.play-btn:hover::before {
		background: rgba(0, 0, 0, 0.75);
	}

	.play-btn :global(svg) {
		position: relative;
		z-index: 1;
	}

	.play-btn:active {
		transform: scale(0.97);
	}
</style>

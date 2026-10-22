<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { useStore } from "@xyflow/svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		/** Flow units between dots at the finest level, the same as the snap grid. */
		gap?: number;
		/** Dot diameter in flow units at the finest level, so it grows and shrinks with zoom. */
		size?: number;
		/** Any CSS colour; the theme's pattern colour when unset. */
		color?: string;
	}

	// =========================
	// CONSTANTS
	// =========================
	// Five levels, each twice as wide. A level fades out between these screen spacings,
	// so a zoomed-out board keeps an even texture instead of a grey haze.
	const LEVELS = 5;
	const FADE_START = 6;
	const FADE_END = 12;
	// Screen-pixel bounds: a dot never vanishes zoomed out or turns into a blob zoomed in.
	const MIN_RADIUS = 0.5;
	const MAX_RADIUS = 2;

	// =========================
	// PROPS
	// =========================
	let {
		gap = 20,
		size = 2,
		color = "var(--xy-background-pattern-color, var(--xy-background-pattern-color-default))",
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	const store = useStore();
	let canvas = $state<HTMLCanvasElement | null>(null);
	let width = $state(0);
	let height = $state(0);
	let ratio = $state(1);
	let theme = $state(0);

	// =========================
	// FUNCTIONS
	// =========================
	function smoothstep(from: number, to: number, value: number) {
		const t = Math.min(1, Math.max(0, (value - from) / (to - from)));
		return t * t * (3 - 2 * t);
	}

	// Pan redraws every frame, so a tile is built once per size and colour.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- render cache written inside the draw effect, never rendered
	const tiles = new Map<string, HTMLCanvasElement>();

	function dotTile(step: number, radius: number, fill: string) {
		const key = `${step}:${radius.toFixed(2)}:${fill}`;
		const hit = tiles.get(key);
		if (hit) return hit;
		if (tiles.size > 64) tiles.clear();
		const tile = document.createElement("canvas");
		tiles.set(key, tile);
		tile.width = step;
		tile.height = step;
		const context = tile.getContext("2d");
		if (!context) return tile;
		context.fillStyle = fill;
		context.beginPath();
		context.arc(step / 2, step / 2, radius, 0, Math.PI * 2);
		context.fill();
		return tile;
	}

	// fallow-ignore-next-line complexity
	function draw(
		element: HTMLCanvasElement,
		view: { x: number; y: number; zoom: number },
		fill: string,
	) {
		const context = element.getContext("2d");
		if (!context) return;
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, element.width, element.height);

		for (let level = 0; level < LEVELS; level++) {
			const spacing = gap * 2 ** level * view.zoom;
			// A coarser level draws bigger dots, so zooming out reads as moving away.
			const screenRadius = (size / 2) * 2 ** level * view.zoom;
			const radius = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, screenRadius)) * ratio;
			const last = level === LEVELS - 1;
			const alpha = last ? 1 : smoothstep(FADE_START, FADE_END, spacing);
			if (alpha <= 0.01) continue;
			const step = spacing * ratio;
			const tileSize = Math.max(2, Math.round(step));
			const scale = step / tileSize;
			const pattern = context.createPattern(dotTile(tileSize, radius / scale, fill), "repeat");
			if (!pattern) return;
			pattern.setTransform(
				new DOMMatrix([scale, 0, 0, scale, view.x * ratio - step / 2, view.y * ratio - step / 2]),
			);
			context.globalAlpha = alpha;
			context.fillStyle = pattern;
			context.fillRect(0, 0, element.width, element.height);
			if (alpha >= 0.999) break;
		}
		context.globalAlpha = 1;
	}

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!canvas) return;
		const element = canvas;
		const observer = new ResizeObserver(() => {
			width = element.clientWidth;
			height = element.clientHeight;
			ratio = window.devicePixelRatio || 1;
		});
		observer.observe(element);
		return () => observer.disconnect();
	});

	// The dot colour is a theme token, so a theme switch redraws.
	$effect(() => {
		const root = document.documentElement;
		const observer = new MutationObserver(() => (theme += 1));
		observer.observe(root, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	});

	// Read once per theme: a computed style read mid-pan restyles the whole page every frame.
	let fill = $derived.by(() => {
		void theme;
		void color;
		return canvas ? getComputedStyle(canvas).color : "";
	});

	// fallow-ignore-next-line complexity
	$effect(() => {
		if (!canvas || !width || !height) return;
		const pixelWidth = Math.round(width * ratio);
		const pixelHeight = Math.round(height * ratio);
		if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
		if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
		draw(canvas, store.viewport, fill);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="svelte-flow__background svelte-flow__container"
	style:color
></canvas>

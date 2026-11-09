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

	/** x, y, width, height in device pixels. */
	type Rect = [number, number, number, number];

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
	// What the canvas holds now, its origin in device pixels. Plain: only the draw effect reads it.
	let painted: {
		zoom: number;
		ratio: number;
		fill: string;
		w: number;
		h: number;
		x: number;
		y: number;
	} | null = null;

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

	/** Fills the given device-pixel rects with the dots, the grid's origin at `originX`, `originY`. */
	// fallow-ignore-next-line complexity
	function paint(
		context: CanvasRenderingContext2D,
		zoom: number,
		fill: string,
		originX: number,
		originY: number,
		rects: Rect[],
	) {
		for (let level = 0; level < LEVELS; level++) {
			const spacing = gap * 2 ** level * zoom;
			// A coarser level draws bigger dots, so zooming out reads as moving away.
			const screenRadius = (size / 2) * 2 ** level * zoom;
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
				new DOMMatrix([scale, 0, 0, scale, originX - step / 2, originY - step / 2]),
			);
			context.globalAlpha = alpha;
			context.fillStyle = pattern;
			for (const [x, y, w, h] of rects) context.fillRect(x, y, w, h);
			if (alpha >= 0.999) break;
		}
		context.globalAlpha = 1;
	}

	/** The strips a shift of `dx`, `dy` uncovers: a column on one side and a row on the other. */
	function uncovered(dx: number, dy: number, w: number, h: number): Rect[] {
		const rects: Rect[] = [];
		if (dx > 0) rects.push([0, 0, dx, h]);
		if (dx < 0) rects.push([w + dx, 0, -dx, h]);
		if (dy > 0) rects.push([0, 0, w, dy]);
		if (dy < 0) rects.push([0, h + dy, w, -dy]);
		return rects;
	}

	// A pan moves the pixels already drawn and paints only the strip it uncovered; anything else repaints it all.
	// fallow-ignore-next-line complexity
	function draw(
		element: HTMLCanvasElement,
		view: { x: number; y: number; zoom: number },
		fill: string,
	) {
		const context = element.getContext("2d");
		if (!context) return;
		const { width: w, height: h } = element;
		const x = view.x * ratio;
		const y = view.y * ratio;
		const last = painted;
		const same =
			last &&
			last.zoom === view.zoom &&
			last.ratio === ratio &&
			last.fill === fill &&
			last.w === w &&
			last.h === h;
		// Whole pixels only, so the shifted dots stay sharp; the rest waits for the next pan or zoom, never past half a pixel.
		const dx = same ? Math.round(x - last.x) : 0;
		const dy = same ? Math.round(y - last.y) : 0;
		if (same && Math.abs(dx) < w && Math.abs(dy) < h) {
			if (!dx && !dy) return;
			context.globalCompositeOperation = "copy";
			context.drawImage(element, dx, dy);
			context.globalCompositeOperation = "source-over";
			painted = { ...last, x: last.x + dx, y: last.y + dy };
			paint(context, view.zoom, fill, painted.x, painted.y, uncovered(dx, dy, w, h));
			return;
		}
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, w, h);
		painted = { zoom: view.zoom, ratio, fill, w, h, x, y };
		paint(context, view.zoom, fill, x, y, [[0, 0, w, h]]);
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

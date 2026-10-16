<script lang="ts" module>
	import type { ImageRevealProps } from "#src/effects/image-reveal/types.js";

	type Phase = "idle" | "reveal" | "visible" | "hide";

	// WHY: one shared decode cache across every instance so a pool of images is
	// only fetched and downsampled once per URL for the whole page.
	const imageCache = new Map<string, Promise<HTMLImageElement>>();

	function loadImage(src: string): Promise<HTMLImageElement> {
		let p = imageCache.get(src);
		if (!p) {
			p = new Promise((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = reject;
				img.src = src;
			});
			imageCache.set(src, p);
		}
		return p;
	}

	function easeOutCubic(t: number): number {
		return 1 - (1 - t) ** 3;
	}

	// WHY: cover-fit source rect so the pixel-cell mosaic frames the image exactly
	// like the crisp draw, keeping cells aligned with the final picture.
	function coverRect(iw: number, ih: number, w: number, h: number) {
		const scale = Math.max(w / iw, h / ih);
		const sw = w / scale;
		const sh = h / scale;
		return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh };
	}
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/image-reveal/ImageReveal.css";
	import { cn } from "@heyramzi/utils";

	// =========================
	// PROPS
	// =========================
	let {
		src,
		autoReveal = false,
		revealDelayRange = [2, 4],
		revealHoldMs = 2000,
		revealDurationMs = 1300,
		revealFadeOutMs = 320,
		cell = 14,
		borderRadius,
		paused = false,
		strength = 1,
		class: className,
		style: userStyle,
	}: ImageRevealProps = $props();

	// =========================
	// STATE
	// =========================
	let motionOK = true;

	const SOFT = 0.28;
	let pool = $derived(Array.isArray(src) ? src : [src]);

	// =========================
	// FUNCTIONS
	// =========================
	function start(node: HTMLCanvasElement) {
		const context2d = node.getContext("2d");
		if (!context2d) return;
		// WHY: narrowing on a const doesn't reach hoisted inner functions, so they read this typed alias.
		const ctx: CanvasRenderingContext2D = context2d;

		motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const dark = () => {
			const root = document.documentElement;
			if (root.classList.contains("dark")) return true;
			if (root.classList.contains("light")) return false;
			return window.matchMedia("(prefers-color-scheme: dark)").matches;
		};

		let cssW = 0;
		let cssH = 0;
		let dpr = 1;
		let cols = 0;
		let rows = 0;
		let cellColors = new Float32Array(0); // rgb per cell, 0..1
		let thresholds = new Float32Array(0);
		let radius = borderRadius ?? 0;

		let phase: Phase = "idle";
		let phaseStart = 0;
		let idleUntil = 0;
		let holdMode: "auto" | "manual" = "auto";
		let lastIdx = -1;
		let currentImg: HTMLImageElement | null = null;
		let rafId = 0;
		let lastFrame = 0;
		let visible = true;

		function detectRadius() {
			if (borderRadius != null) {
				radius = borderRadius;
				return;
			}
			const cs = getComputedStyle(node);
			const r = parseFloat(cs.borderTopLeftRadius);
			radius = isNaN(r) ? 0 : r;
		}

		function resize() {
			const rect = node.getBoundingClientRect();
			cssW = Math.max(1, rect.width);
			cssH = Math.max(1, rect.height);
			dpr = Math.min(2, window.devicePixelRatio || 1);
			node.width = Math.round(cssW * dpr);
			node.height = Math.round(cssH * dpr);
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			cols = Math.max(2, Math.round(cssW / cell));
			rows = Math.max(2, Math.round(cssH / cell));
			cellColors = new Float32Array(cols * rows * 3);
			thresholds = new Float32Array(cols * rows);
			// WHY: a per-cell random threshold drives the dissolve order so cells
			// resolve in a scattered "generating" pattern rather than a flat wipe.
			for (let i = 0; i < thresholds.length; i++) thresholds[i] = Math.random();
			detectRadius();
			if (currentImg) sampleCells(currentImg);
		}

		function sampleCells(img: HTMLImageElement) {
			const off = document.createElement("canvas");
			off.width = cols;
			off.height = rows;
			const octx = off.getContext("2d");
			if (!octx) return;
			const { sx, sy, sw, sh } = coverRect(img.naturalWidth, img.naturalHeight, cols, rows);
			octx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
			const data = octx.getImageData(0, 0, cols, rows).data;
			for (let i = 0; i < cols * rows; i++) {
				cellColors[i * 3] = data[i * 4] / 255;
				cellColors[i * 3 + 1] = data[i * 4 + 1] / 255;
				cellColors[i * 3 + 2] = data[i * 4 + 2] / 255;
			}
		}

		function roundPath() {
			ctx.beginPath();
			const r = Math.min(radius, cssW / 2, cssH / 2);
			ctx.roundRect(0, 0, cssW, cssH, r);
		}

		function shimmerColor(cx: number, cy: number, t: number, isDark: boolean): string {
			const time = motionOK ? t : 0;
			const n = Math.sin(cx * 0.55 + time * 0.0009) * Math.cos(cy * 0.5 - time * 0.0007);
			const hue = (215 + n * 55 + time * 0.012) % 360;
			const light = isDark ? 24 + (n + 1) * 9 : 78 + n * 7;
			return `hsl(${hue} 65% ${light}%)`;
		}

		function render(now: number) {
			const isDark = dark();
			const cw = cssW / cols;
			const ch = cssH / rows;

			// phase scalars
			let reveal = 0;
			let crisp = 0;
			let layer = 1;
			const el = now - phaseStart;
			if (phase === "reveal") {
				reveal = easeOutCubic(Math.min(1, el / (motionOK ? revealDurationMs : 1)));
			} else if (phase === "visible") {
				reveal = 1;
				crisp = easeOutCubic(Math.min(1, el / 250));
			} else if (phase === "hide") {
				reveal = 1;
				crisp = 1;
				layer = 1 - Math.min(1, el / (motionOK ? revealFadeOutMs : 1));
			}

			ctx.save();
			roundPath();
			ctx.clip();

			// base shimmer
			ctx.globalAlpha = 1;
			for (let cy = 0; cy < rows; cy++) {
				for (let cx = 0; cx < cols; cx++) {
					ctx.fillStyle = shimmerColor(cx, cy, now, isDark);
					ctx.fillRect(cx * cw, cy * ch, cw + 1, ch + 1);
				}
			}

			// pixel-cell reveal layer
			if (reveal > 0 && layer > 0) {
				for (let cy = 0; cy < rows; cy++) {
					for (let cx = 0; cx < cols; cx++) {
						const idx = cy * cols + cx;
						const amt = Math.max(0, Math.min(1, (reveal * (1 + SOFT) - thresholds[idx]) / SOFT));
						if (amt <= 0) continue;
						const r = cellColors[idx * 3];
						const g = cellColors[idx * 3 + 1];
						const b = cellColors[idx * 3 + 2];
						ctx.globalAlpha = amt * layer;
						ctx.fillStyle = `rgb(${(r * 255) | 0} ${(g * 255) | 0} ${(b * 255) | 0})`;
						ctx.fillRect(cx * cw, cy * ch, cw + 1, ch + 1);
					}
				}
			}

			// crisp full-resolution image
			if (crisp > 0 && layer > 0 && currentImg) {
				const { sx, sy, sw, sh } = coverRect(
					currentImg.naturalWidth,
					currentImg.naturalHeight,
					cssW,
					cssH,
				);
				ctx.globalAlpha = crisp * layer;
				ctx.drawImage(currentImg, sx, sy, sw, sh, 0, 0, cssW, cssH);
			}

			ctx.globalAlpha = 1;
			ctx.restore();
		}

		function pickSrc(): string | null {
			if (pool.length === 0) return null;
			if (pool.length === 1) {
				lastIdx = 0;
				return pool[0];
			}
			let idx = Math.floor(Math.random() * pool.length);
			if (idx === lastIdx) idx = (idx + 1) % pool.length;
			lastIdx = idx;
			return pool[idx];
		}

		async function beginReveal(mode: "auto" | "manual") {
			const chosen = pickSrc();
			if (!chosen) return;
			holdMode = mode;
			try {
				const img = await loadImage(chosen);
				currentImg = img;
				sampleCells(img);
				phase = "reveal";
				phaseStart = performance.now();
			} catch {
				// WHY: a broken URL just leaves the shimmer running, no reveal.
				scheduleIdle();
			}
		}

		function beginHide() {
			phase = "hide";
			phaseStart = performance.now();
		}

		function scheduleIdle() {
			phase = "idle";
			const [lo, hi] = revealDelayRange;
			idleUntil = performance.now() + (lo + Math.random() * Math.max(0, hi - lo)) * 1000;
		}

		function tick(now: number) {
			rafId = requestAnimationFrame(tick);
			if (paused || !visible) {
				lastFrame = now;
				return;
			}
			// WHY: 30 fps cap matches the slow drift; rendering faster wastes paint.
			if (now - lastFrame < 33) return;
			lastFrame = now;

			const el = now - phaseStart;
			if (phase === "idle") {
				if (autoReveal && pool.length && now >= idleUntil) beginReveal("auto");
			} else if (phase === "reveal" && el >= (motionOK ? revealDurationMs : 1)) {
				phase = "visible";
				phaseStart = now;
			} else if (phase === "visible" && holdMode === "auto" && el >= revealHoldMs) {
				beginHide();
			} else if (phase === "hide" && el >= (motionOK ? revealFadeOutMs : 1)) {
				currentImg = null;
				scheduleIdle();
			}

			node.style.opacity = String(Math.max(0, Math.min(1, strength)));
			render(now);
		}

		// lifecycle
		resize();
		scheduleIdle();
		const ro = new ResizeObserver(() => resize());
		ro.observe(node);
		const io = new IntersectionObserver(
			([e]) => {
				visible = e.isIntersecting;
			},
			{ rootMargin: "64px" },
		);
		io.observe(node);
		rafId = requestAnimationFrame(tick);

		// expose imperative controls to the component scope
		api = {
			triggerReveal(opts) {
				if (phase === "idle") beginReveal(opts?.hold ?? "auto");
			},
			triggerHide() {
				if (phase === "reveal" || phase === "visible") beginHide();
			},
			isImageActive() {
				return phase !== "idle";
			},
		};

		return {
			destroy() {
				cancelAnimationFrame(rafId);
				ro.disconnect();
				io.disconnect();
				api = null;
			},
		};
	}

	// =========================
	// IMPERATIVE HANDLE
	// =========================
	let api: import("#src/effects/image-reveal/types.js").ImageRevealHandle | null = null;

	export function triggerReveal(opts?: { hold?: "auto" | "manual" }) {
		api?.triggerReveal(opts);
	}
	export function triggerHide() {
		api?.triggerHide();
	}
	export function isImageActive() {
		return api?.isImageActive() ?? false;
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class={cn("hr-image-reveal", className)} style={userStyle}>
	<canvas use:start aria-hidden="true"></canvas>
</div>

<script lang="ts">
	import { X } from "phosphor-svelte";
	import DemoStage from "#lib/DemoStage.svelte";
	import { cssNum } from "#lib/demos/motion/css-num.js";

	const CLEAR_TEXT = "project deadline";

	let clearWrap: HTMLElement | null = null;
	let clearInput: HTMLInputElement | null = null;
	let clearMirror: HTMLElement | null = null;
	let clearPhold: HTMLElement | null = null;
	let clearGlow: HTMLElement | null = null;
	let clearBusy = false;

	// Minimal cubic-bezier sampler so the JS easing matches the CSS curves.
	function cubicBezier(str: string) {
		const m = str.match(/cubic-bezier\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)\)/);
		if (!m) return (t: number) => t;
		const [x1, y1, x2, y2] = m.slice(1).map(Number);
		const cx = 3 * x1;
		const bx = 3 * (x2 - x1) - cx;
		const ax = 1 - cx - bx;
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		const ay = 1 - cy - by;
		return (t: number) => {
			if (t <= 0) return 0;
			if (t >= 1) return 1;
			let s = t;
			for (let i = 0; i < 8; i++) {
				const dx = ((ax * s + bx) * s + cx) * s - t;
				const d = (3 * ax * s + 2 * bx) * s + cx;
				if (Math.abs(dx) < 1e-6 || d === 0) break;
				s -= dx / d;
			}
			return ((ay * s + by) * s + cy) * s;
		};
	}

	function buildClearGlow(text: string, isDark: boolean) {
		if (!clearInput || !clearWrap) return "";
		const ctx = document.createElement("canvas").getContext("2d");
		if (!ctx) return "";
		ctx.font = getComputedStyle(clearInput).font;
		const rgb = isDark ? "255,255,255" : "0,0,0";
		const w = clearWrap.clientWidth || 280;
		const padLeft = parseFloat(getComputedStyle(clearInput).paddingLeft) || 12;
		const spread = cssNum("--glow-spread", 1.5);
		const layers: string[] = [];
		let x = 0;
		text.split(/(\s+)/).forEach((seg) => {
			const segW = ctx.measureText(seg).width;
			if (seg.trim()) {
				const cx = padLeft + x + segW / 2;
				const hw = Math.max(segW * 0.45, 8) * spread;
				(
					[
						[0, 0.8, 7, 0.22],
						[hw * 0.45, 0.55, 8, 0.18],
						[-hw * 0.4, 0.65, 6, 0.16],
						[hw * 0.15, 0.9, 5, 0.14],
					] as const
				).forEach(([dx, rwm, rh, a]) => {
					const lx = (((cx + dx) / w) * 100).toFixed(2);
					layers.push(
						`radial-gradient(ellipse ${Math.max(hw * rwm, 2).toFixed(1)}px ${rh}px at ${lx}% 100%, rgba(${rgb},${a}), transparent)`,
					);
				});
			}
			x += segW;
		});
		return layers.join(", ");
	}

	function triggerClear() {
		if (clearBusy || !clearWrap || !clearInput || !clearMirror || !clearPhold || !clearGlow) return;
		// Repeatable demo: an empty field refills instantly instead of clearing.
		if (!clearInput.value) {
			clearInput.value = CLEAR_TEXT;
			clearMirror.textContent = CLEAR_TEXT;
			clearWrap.classList.add("has-value");
			return;
		}
		clearBusy = true;
		const isDark = !document.documentElement.classList.contains("light");
		const total = cssNum("--clear-dur", 1000);
		const outDur = cssNum("--clear-out-dur", 400);
		const inDur = cssNum("--clear-in-dur", 400);
		const outFly = cssNum("--clear-out-fly", 12);
		const inFly = cssNum("--clear-in-fly", 12);
		const blur = cssNum("--clear-blur", 2);
		const delay = cssNum("--glow-delay", 50);
		const peakAt = cssNum("--glow-peak-at", 0.15);
		const gOp = isDark ? 0.85 : cssNum("--glow-opacity", 0.42);
		const cs = getComputedStyle(document.documentElement);
		const easeOut = cubicBezier(cs.getPropertyValue("--clear-out-ease"));
		const easeIn = cubicBezier(cs.getPropertyValue("--clear-in-ease"));

		const text = clearInput.value;
		clearMirror.textContent = text;
		clearInput.value = "";
		clearWrap.classList.remove("has-value");
		clearWrap.classList.add("is-clearing");
		clearGlow.style.mixBlendMode = isDark ? "screen" : "multiply";
		clearGlow.style.background = buildClearGlow(text, isDark);
		clearGlow.style.opacity = "0";
		clearPhold.style.transform = `translateY(-${inFly}px)`;
		clearPhold.style.opacity = "0.9";
		clearPhold.style.filter = `blur(${blur}px)`;

		const start = performance.now();
		const tick = (now: number) => {
			if (!clearWrap || !clearMirror || !clearPhold || !clearGlow) return;
			const el = now - start;
			const eo = easeOut(Math.min(1, el / outDur));
			clearMirror.style.transform = `translateY(${(eo * outFly).toFixed(1)}px)`;
			clearMirror.style.opacity = (1 - eo).toFixed(3);
			clearMirror.style.filter = `blur(${(eo * blur).toFixed(1)}px)`;

			const ei = easeIn(Math.min(1, el / inDur));
			clearPhold.style.transform = `translateY(${(-inFly + ei * inFly).toFixed(1)}px)`;
			clearPhold.style.opacity = (0.9 + ei * 0.1).toFixed(3);
			clearPhold.style.filter = `blur(${(blur - ei * blur).toFixed(1)}px)`;

			let g = 0;
			if (el > delay) {
				const gp = Math.min(1, (el - delay) / Math.max(1, total - delay));
				g = gp < peakAt ? gp / peakAt : 1 - (gp - peakAt) / (1 - peakAt);
			}
			clearGlow.style.opacity = (g * gOp).toFixed(3);

			if (el < total) {
				requestAnimationFrame(tick);
			} else {
				clearWrap.classList.remove("is-clearing");
				clearMirror.style.cssText = "";
				clearPhold.style.cssText = "";
				clearMirror.textContent = "";
				clearGlow.style.opacity = "0";
				clearGlow.style.background = "";
				clearBusy = false;
			}
		};
		requestAnimationFrame(tick);
	}
</script>

<DemoStage
	title="Input clear"
	note="Fly-out text with per-word streak"
	importPath={"import '@heyramzi/ui/animations/input-clear-dissolve.css';"}
	actionLabel="Clear"
	onaction={triggerClear}
>
	<div bind:this={clearWrap} class="t-clear clear-field has-value">
		<input
			bind:this={clearInput}
			class="clear-input"
			type="text"
			value={CLEAR_TEXT}
			readonly
			aria-label="Search"
		/>
		<div bind:this={clearMirror} class="t-clear-mirror clear-text" aria-hidden="true">
			{CLEAR_TEXT}
		</div>
		<div
			bind:this={clearPhold}
			class="t-clear-placeholder clear-text clear-ph"
			aria-hidden="true"
		>
			Search
		</div>
		<div bind:this={clearGlow} class="t-clear-glow" aria-hidden="true"></div>
		<button type="button" class="t-clear-btn clear-x" onclick={triggerClear} aria-label="Clear">
			<X class="size-3.5" />
		</button>
	</div>
</DemoStage>

<style>
	.clear-field {
		width: 14rem;
		height: 2.75rem;
		border-radius: 10px;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
	}
	.clear-input {
		width: 100%;
		height: 100%;
		padding: 0 2.25rem 0 0.75rem;
		border: 0;
		background: transparent;
		outline: none;
		font: inherit;
		font-size: 0.9375rem;
		color: var(--td-text);
	}
	.clear-text {
		padding-left: 0.75rem;
		font-size: 0.9375rem;
		color: var(--td-text);
	}
	.clear-ph {
		color: var(--td-text-subtle);
	}
	.clear-x {
		position: absolute;
		top: 50%;
		right: 0.5rem;
		transform: translateY(-50%);
		z-index: 4;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: 0;
		border-radius: 50%;
		background: var(--td-copy-bg);
		color: var(--td-icon-color-muted);
		cursor: pointer;
	}
	@media (hover: hover) and (pointer: fine) {
		.clear-x:hover {
			background: var(--td-copy-bg-hover);
			color: var(--td-icon-color);
		}
	}
</style>

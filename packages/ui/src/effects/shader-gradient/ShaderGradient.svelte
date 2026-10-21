<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { untrack } from "svelte";
	import { cn } from "#src/lib/utils.js";
	import { resolveColor } from "#src/effects/shader-gradient/color.js";
	import {
		createShaderGradientRenderer,
		type ShaderGradientRenderer,
	} from "#src/effects/shader-gradient/renderer.js";
	import type {
		ShaderGradientProps,
		ShaderGradientUniforms,
	} from "#src/effects/shader-gradient/types.js";

	// =========================
	// PROPS
	// =========================
	// The defaults are the shadergradient.co plane preset, so an instance with no
	// props renders the reference field.
	let {
		class: className,
		color1 = "#ff5005",
		color2 = "#dbba95",
		color3 = "#d0bce1",
		bgColor = "#000000",
		animate = true,
		brightness = 1.2,
		cAzimuthAngle = 180,
		cPolarAngle = 90,
		cDistance = 3.6,
		fov = 45,
		positionX = -1.4,
		positionY = 0,
		positionZ = 0,
		rotationX = 0,
		rotationY = 10,
		rotationZ = 50,
		uDensity = 1.3,
		uSpeed = 0.4,
		uStrength = 4,
		uTime = 0,
		grain = true,
		grainRadius = 2,
		pixelDensity = 1,
	}: ShaderGradientProps = $props();

	// =========================
	// STATE
	// =========================
	let wrapperEl = $state<HTMLDivElement | null>(null);
	let canvasEl = $state<HTMLCanvasElement | null>(null);
	let renderer = $state<ShaderGradientRenderer | null>(null);
	let sizeVersion = $state(0);
	let isVisible = $state(false);
	let tabActive = $state(true);
	let reducedMotion = $state(false);
	let failed = $state(false);
	let retriedContext = false;

	/**
	 * Seconds of noise travel, held across pauses the way three's Clock does. uTime is
	 * the starting offset only: the clock owns the value from the first frame on.
	 */
	let elapsed = untrack(() => uTime);

	// =========================
	// DERIVED
	// =========================
	// A gradient nobody can see is a GPU running for nothing, so the loop stops when
	// the section scrolls away or the tab goes to the background.
	let running = $derived(isVisible && tabActive && animate && !reducedMotion);

	let uniforms = $derived<ShaderGradientUniforms>({
		color1: resolveColor(color1, wrapperEl),
		color2: resolveColor(color2, wrapperEl),
		color3: resolveColor(color3, wrapperEl),
		bgColor: resolveColor(bgColor, wrapperEl),
		brightness,
		cAzimuthAngle,
		cPolarAngle,
		cDistance,
		fov,
		positionX,
		positionY,
		positionZ,
		rotationX,
		rotationY,
		rotationZ,
		uDensity,
		uSpeed,
		uStrength,
		grain,
		grainRadius,
	});

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!wrapperEl) return;

		const observer = new IntersectionObserver(([entry]) => (isVisible = entry.isIntersecting), {
			threshold: 0,
		});
		observer.observe(wrapperEl);

		return () => observer.disconnect();
	});

	$effect(() => {
		const onVisibility = () => (tabActive = document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVisibility);

		const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
		reducedMotion = motion.matches;
		const onMotion = () => (reducedMotion = motion.matches);
		motion.addEventListener("change", onMotion);

		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			motion.removeEventListener("change", onMotion);
		};
	});

	// The context is built once per canvas, so changing a color or an angle never
	// costs a new one.
	$effect(() => {
		const canvas = canvasEl;
		const wrapper = wrapperEl;
		if (!canvas || !wrapper) return;

		// A device with no WebGL, or a driver that rejects the program, drops the canvas and leaves whatever the section paints behind it.

		// A hero must not go blank over a background effect.
		let created: ShaderGradientRenderer | null = null;
		try {
			created = createShaderGradientRenderer(canvas);
		} catch (error) {
			console.error(error);
		}
		if (!created) {
			failed = true;
			return;
		}

		const instance = created;
		const scale = Math.min(pixelDensity, window.devicePixelRatio || 1);
		const resize = new ResizeObserver(() => {
			const rect = wrapper.getBoundingClientRect();
			instance.setSize(rect.width * scale, rect.height * scale);
			sizeVersion += 1;
		});
		resize.observe(wrapper);

		/*
		 * A browser keeps a small number of WebGL contexts, around a dozen and a half in Chrome, and drops the oldest to make room.
		 */

		/*
		 * A page carrying several fields can cross that line, and a driver can reset one at any time on its own.
		 */

		/*
		 * The canvas is opaque, so a lost context is a black rectangle, which is worse than no field at all.
		 */

		/*
		 * Dropping the canvas puts the section back on its own background, and one retry covers the reset that was nobody's fault.
		 */
		const onLost = (event: Event) => {
			event.preventDefault();
			failed = true;
			if (retriedContext) return;
			retriedContext = true;
			setTimeout(() => (failed = false), 1000);
		};
		canvas.addEventListener("webglcontextlost", onLost);
		renderer = instance;

		return () => {
			renderer = null;
			canvas.removeEventListener("webglcontextlost", onLost);
			resize.disconnect();
			instance.destroy();
		};
	});

	// One frame per prop change while paused, a loop while running.
	$effect(() => {
		const instance = renderer;
		const current = uniforms;
		const isRunning = running;
		void sizeVersion;
		if (!instance) return;

		let frame = 0;
		let previous = 0;

		const draw = (now: number) => {
			if (isRunning) {
				elapsed += previous ? (now - previous) / 1000 : 0;
				previous = now;
				frame = requestAnimationFrame(draw);
			}
			instance.render(current, elapsed);
		};

		frame = requestAnimationFrame(draw);

		return () => cancelAnimationFrame(frame);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div
	bind:this={wrapperEl}
	class={cn("hr-shader-gradient relative overflow-hidden", className)}
	aria-hidden="true"
>
	{#if !failed}
		<canvas bind:this={canvasEl} class="block size-full"></canvas>
	{/if}
</div>

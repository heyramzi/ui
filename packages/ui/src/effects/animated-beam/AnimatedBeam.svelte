<script lang="ts" module>
	import type { AnimatedBeamProps } from "#src/effects/animated-beam/types.js";
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { cn } from "@heyramzi/utils";
	import BeamSvg from "#src/effects/animated-beam/diagrams/BeamSvg.svelte";
	import { usePathCalculator } from "#src/effects/animated-beam/path-calculator.svelte.js";

	// =========================
	// PROPS
	// =========================
	let {
		class: className,
		containerRef,
		fromRef,
		toRef,
		curvature = 0,
		reverse = false,
		duration = 4,
		delay = 0,
		pathColor = "gray",
		pathWidth = 2,
		pathOpacity = 0.2,
		gradientStartColor = "#ffaa40",
		gradientStopColor = "#414fd2",
		startXOffset = 0,
		startYOffset = 0,
		endXOffset = 0,
		endYOffset = 0,
		fromAnchor = "center",
		toAnchor = "center",
	}: AnimatedBeamProps = $props();

	// =========================
	// STATE
	// =========================
	const id = `beam-${Math.random().toString(36).slice(2, 10)}`;
	const path = usePathCalculator();
	let motionOK = $state(true);

	// ========================= DERIVED ========================= WHY: a short bright band (the stops) is swept along the path by animating the

	// gradient vector. forward runs the comet from start to end, reverse the other way.

	// Same coordinate pairs the motion-sv version used, as SMIL value lists, so no animation runtime is pulled into the dependency-free package.
	const coords = $derived(
		reverse ? { x1: "90%;-10%", x2: "100%;0%" } : { x1: "10%;110%", x2: "0%;100%" },
	);

	// =========================
	// FUNCTIONS
	// =========================
	function updatePath() {
		path.calculatePath(
			containerRef,
			fromRef,
			toRef,
			curvature,
			startXOffset,
			startYOffset,
			endXOffset,
			endYOffset,
			fromAnchor,
			toAnchor,
		);
	}

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		// WHY: touch every geometry input so the path recomputes when a ref,
		// anchor, or offset changes, not just on container resize.
		void [
			containerRef,
			fromRef,
			toRef,
			curvature,
			startXOffset,
			startYOffset,
			endXOffset,
			endYOffset,
			fromAnchor,
			toAnchor,
		];
		updatePath();
		if (!containerRef) return;
		let raf = 0;
		const ro = new ResizeObserver(() => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(updatePath);
		});
		ro.observe(containerRef);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
		};
	});

	$effect(() => {
		if (typeof window === "undefined") return;
		const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
		motionOK = !mq.matches;
		const onChange = () => (motionOK = !mq.matches);
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<BeamSvg
	{id}
	class={cn("pointer-events-none absolute left-0 top-0 transform-gpu stroke-2", className)}
	width={path.svgDimensions.width}
	height={path.svgDimensions.height}
	pathD={path.pathD}
	{pathColor}
	{pathWidth}
	{pathOpacity}
	{motionOK}
	{coords}
	{duration}
	{delay}
	{gradientStartColor}
	{gradientStopColor}
/>

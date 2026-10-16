<script lang="ts" module>
	import type { ResolvedTheme } from "#src/effects/border-beam/presets.js";
	import type { BorderBeamProps } from "#src/effects/border-beam/types.js";
</script>

<script lang="ts">
	// IMPORTS
	import { onDestroy, onMount } from "svelte";
	import { generateCss } from "#src/effects/border-beam/css.js";
	import { sizePresets, sizeThemePresets } from "#src/effects/border-beam/presets.js";
	import { registerBorderBeamProperties } from "#src/effects/border-beam/register-properties.js";

	// PROPS
	let {
		children,
		size = "md",
		colorVariant = "colorful",
		theme = "dark",
		staticColors = false,
		duration,
		active = true,
		borderRadius,
		brightness = 1.3,
		saturation,
		hueRange = 30,
		strength = 1,
		colors,
		bloom = true,
		pauseWhenOffscreen = true,
		class: className,
		onActivate,
		onDeactivate,
		onanimationend: userAnimationEnd,
		style: userStyle,
		...rest
	}: BorderBeamProps = $props();

	// STATE
	const uid = `bb-${Math.random().toString(36).slice(2, 10)}`;
	let container = null;
	let systemTheme = $state<ResolvedTheme>("dark");
	let isActive = $state(false);
	let isFading = $state(false);
	let detectedRadius = $state<number | null>(null);
	let isOffscreen = $state(false);
	let isDocHidden = $state(false);

	// DERIVED
	const resolvedTheme = $derived(theme === "auto" ? systemTheme : theme);
	const sizeConfig = $derived(sizePresets[size]);
	const themeColorsForSize = $derived(sizeThemePresets[size][resolvedTheme]);
	const effectiveRadius = $derived(borderRadius ?? detectedRadius ?? sizeConfig.borderRadius);
	const effectiveDuration = $derived(duration ?? (size === "line" ? 2.4 : 1.96));
	const effectiveSaturation = $derived(saturation ?? themeColorsForSize.saturation);
	const effectiveHueRange = $derived(size === "line" ? Math.min(hueRange, 13) : hueRange);
	const resolvedStatic = $derived(colorVariant === "mono" ? true : staticColors);

	const css = $derived(
		generateCss({
			id: uid,
			borderRadius: effectiveRadius,
			borderWidth: sizeConfig.borderWidth,
			duration: effectiveDuration,
			strokeOpacity: themeColorsForSize.strokeOpacity,
			innerOpacity: themeColorsForSize.innerOpacity,
			bloomOpacity: themeColorsForSize.bloomOpacity,
			innerShadow: themeColorsForSize.innerShadow,
			size,
			colorVariant,
			staticColors: resolvedStatic,
			brightness,
			saturation: effectiveSaturation,
			hueRange: effectiveHueRange,
			theme: resolvedTheme,
			colors,
			bloom,
		}),
	);

	// WHY: paused state combines viewport visibility and document visibility.
	// Either being false freezes the beam via `animation-play-state: paused`.
	const paused = $derived(pauseWhenOffscreen && (isOffscreen || isDocHidden));

	const clampedStrength = $derived(Math.max(0, Math.min(1, strength)));

	// EFFECTS
	let mediaQuery: MediaQueryList | null = null;
	let radiusObserver: MutationObserver | null = null;
	let visibilityObserver: IntersectionObserver | null = null;

	onMount(() => {
		// WHY: shadow-DOM consumers (chrome extensions, embedded widgets) hit a Chromium edge case where @property at-rules emitted in an injected stylesheet do not register reliably for the shadow scope.

		// Without the registration, the angle property is treated as a string, the keyframe can't interpolate, and the beam appears frozen with one repaint per iteration.

		// CSS.registerProperty is global and document-scoped so it always succeeds, and duplicate registrations are silently ignored.
		registerBorderBeamProperties(uid, size);

		if (typeof window !== "undefined") {
			mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			systemTheme = mediaQuery.matches ? "dark" : "light";
			const handler = (e: MediaQueryListEvent) => {
				systemTheme = e.matches ? "dark" : "light";
			};
			mediaQuery.addEventListener("change", handler);
			return () => mediaQuery?.removeEventListener("change", handler);
		}
	});

	$effect(() => {
		if (borderRadius != null || !container) return;
		const detect = () => {
			const first = container?.firstElementChild as HTMLElement | null;
			if (!first) return;
			const cs = getComputedStyle(first);
			const r = parseFloat(cs.borderTopLeftRadius);
			if (!isNaN(r) && r > 0) detectedRadius = r;
		};
		detect();
		radiusObserver = new MutationObserver(detect);
		radiusObserver.observe(container, { childList: true, subtree: false });
		return () => radiusObserver?.disconnect();
	});

	$effect(() => {
		if (active && !isActive && !isFading) {
			isActive = true;
		} else if (!active && isActive && !isFading) {
			isFading = true;
		}
	});

	// WHY: pause beam animation while the host is offscreen or the tab is hidden.

	// CSS animations keep ticking on backgrounded tabs in some browsers, and an offscreen beam burns rasterization budget for nothing.
	$effect(() => {
		if (!pauseWhenOffscreen || !container || typeof window === "undefined") return;

		visibilityObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry) isOffscreen = !entry.isIntersecting;
			},
			{ rootMargin: "64px" },
		);
		visibilityObserver.observe(container);

		const onVisChange = () => {
			isDocHidden = document.hidden;
		};
		isDocHidden = document.hidden;
		document.addEventListener("visibilitychange", onVisChange);

		return () => {
			visibilityObserver?.disconnect();
			visibilityObserver = null;
			document.removeEventListener("visibilitychange", onVisChange);
		};
	});

	onDestroy(() => {
		mediaQuery = null;
		radiusObserver?.disconnect();
		visibilityObserver?.disconnect();
	});

	// FUNCTIONS
	function handleAnimationEnd(e: AnimationEvent) {
		const name = e.animationName;
		if (name.includes("fade-out")) {
			isActive = false;
			isFading = false;
			onDeactivate?.();
		} else if (name.includes("fade-in")) {
			onActivate?.();
		}
		userAnimationEnd?.(e as AnimationEvent & { currentTarget: EventTarget & HTMLDivElement });
	}

	// WHY: imperative CSS injection via Svelte action. The rolldown-based

	// vite-plugin-svelte preprocessor does naive substring matching for the stylesheet markup, so an inline @html template literal containing the markup tag would trip postcss on the interpolated text.

	// The action route attaches a real stylesheet node next to the host, bypassing the HTML parser entirely.
	function injectStyle(node: Element, value: string) {
		const styleEl = node.ownerDocument.createElement("style");
		styleEl.textContent = value;
		node.parentNode?.insertBefore(styleEl, node);
		// WHY: $derived recomputes on any prop change, but the CSS string is
		// often identical across reruns. Skip the DOM write so the browser
		// doesn't re-parse the stylesheet for no reason.
		let last = value;
		return {
			update(next: string) {
				if (next === last) return;
				last = next;
				styleEl.textContent = next;
			},
			destroy() {
				styleEl.remove();
			},
		};
	}
</script>

<!-- MARKUP -->
<div
	bind:this={container}
	{...rest}
	data-beam={uid}
	data-active={isActive && !isFading ? "" : undefined}
	data-fading={isFading ? "" : undefined}
	data-paused={paused ? "" : undefined}
	class={className}
	style="--beam-strength: {clampedStrength};{userStyle ?? ''}"
	onanimationend={handleAnimationEnd}
	use:injectStyle={css}
>
	{@render children()}
	{#if bloom}
		<div data-beam-bloom></div>
	{/if}
</div>

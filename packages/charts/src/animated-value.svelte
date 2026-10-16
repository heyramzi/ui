<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "./animated-value.css";
	import { untrack } from "svelte";
	import { cn } from "@heyramzi/utils";

	// =========================
	// TYPES
	// =========================
	type Props = {
		/** Target number. The display counts up to it on mount and tweens on change. */
		value: number;
		/** Fixed decimal places when no `formatOptions` is given. */
		decimals?: number;
		/** Count-up duration in ms. */
		duration?: number;
		/** Custom formatter for the live number. Wins over `formatOptions`/`decimals`. */
		format?: (value: number) => string;
		/** Intl number formatting (currency, compact, percent, ...). Wins over `decimals`. */
		formatOptions?: Intl.NumberFormatOptions;
		/** BCP-47 locale for `formatOptions`. */
		locale?: string;
		/** Rendered before the number. */
		prefix?: string;
		/** Rendered after the number. */
		suffix?: string;
		class?: string;
		style?: string;
	};

	// =========================
	// PROPS
	// =========================
	let {
		value,
		decimals = 0,
		duration = 800,
		format,
		formatOptions,
		locale,
		prefix,
		suffix,
		class: className,
		style,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let displayed = $state(0);
	let started = $state(false);

	// =========================
	// DERIVED
	// =========================
	const formatter = $derived(formatOptions ? new Intl.NumberFormat(locale, formatOptions) : null);
	const currentValue = $derived(started ? displayed : value);
	const text = $derived(
		format
			? format(currentValue)
			: formatter
				? formatter.format(currentValue)
				: currentValue.toFixed(decimals),
	);

	// ========================= EFFECTS ========================= WHY: $effect only runs in the browser, so SSR renders the final value (no flash).

	// `value` is the sole tracked dependency; `displayed` is read and written inside untrack() so the per-frame writes don't retrigger the effect (that self-dependency loops and Svelte bails, freezing the number).

	// The first run sweeps from 0; later value changes tween from the current display.
	$effect(() => {
		const target = value;
		let raf = 0;
		untrack(() => {
			const reduced =
				typeof window !== "undefined" &&
				window.matchMedia("(prefers-reduced-motion: reduce)").matches;

			const from = started ? displayed : 0;
			started = true;

			// WHY: snap (no tween) when motion is off, the delta is tiny, or the tab

			// is hidden. rAF is paused in background tabs, so animating there would leave the number stale until the tab is shown; snapping keeps it correct.
			if (reduced || document.hidden || Math.abs(target - from) < 0.005) {
				displayed = target;
				return;
			}

			const start = performance.now();
			const tick = (now: number) => {
				const t = Math.min((now - start) / duration, 1);
				const eased = 1 - (1 - t) ** 3;
				displayed = from + (target - from) * eased;
				if (t < 1) raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
		});
		return () => cancelAnimationFrame(raf);
	});
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span class={cn("hr-animated-value tabular-nums", className)} {style}
	>{prefix ?? ""}{text}{suffix ?? ""}</span
>

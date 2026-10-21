<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import "#src/effects/spotlight/Spotlight.css";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		class?: string;
		fill?: string;
	};

	// =========================
	// PROPS
	// =========================
	let { class: className, fill = "white" }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svg
	class={cn(
		"hr-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] animate-spotlight opacity-0 lg:w-[84%]",
		className,
	)}
	xmlns="http://www.w3.org/2000/svg"
	viewBox="0 0 3787 2842"
	fill="none"
>
	<g filter="url(#spotlight-filter)">
		<ellipse
			cx="1924.71"
			cy="273.501"
			rx="1924.71"
			ry="273.501"
			transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
			{fill}
			fill-opacity="0.21"
		></ellipse>
	</g>
	<defs>
		<filter
			id="spotlight-filter"
			x="0.860352"
			y="0.838989"
			width="3785.16"
			height="2840.26"
			filterUnits="userSpaceOnUse"
			color-interpolation-filters="sRGB"
		>
			<feFlood flood-opacity="0" result="BackgroundImageFix"></feFlood>
			<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"></feBlend>
			<feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur"></feGaussianBlur>
		</filter>
	</defs>
</svg>

<script lang="ts">
	// =========================
	// PROPS
	// =========================
	interface Props {
		id: string;
		class?: string;
		width: number;
		height: number;
		pathD: string;
		pathColor: string;
		pathWidth: number;
		pathOpacity: number;
		motionOK: boolean;
		coords: { x1: string; x2: string };
		duration: number;
		delay: number;
		gradientStartColor: string;
		gradientStopColor: string;
	};
	let {
		id,
		class: className,
		width,
		height,
		pathD,
		pathColor,
		pathWidth,
		pathOpacity,
		motionOK,
		coords,
		duration,
		delay,
		gradientStartColor,
		gradientStopColor,
	}: Props = $props();
</script>

<svg
	fill="none"
	{width}
	{height}
	xmlns="http://www.w3.org/2000/svg"
	class={className}
	viewBox="0 0 {width} {height}"
>
	<path
		d={pathD}
		stroke={pathColor}
		stroke-width={pathWidth}
		stroke-opacity={pathOpacity}
		stroke-linecap="round"
	/>
	{#if motionOK}
		<path
			d={pathD}
			stroke-width={pathWidth}
			stroke={`url(#${id})`}
			stroke-opacity="1"
			stroke-linecap="round"
		/>
		<defs>
			<linearGradient {id} gradientUnits="userSpaceOnUse" x1="0%" x2="0%" y1="0%" y2="0%">
				<animate
					attributeName="x1"
					values={coords.x1}
					dur="{duration}s"
					begin="{delay}s"
					calcMode="spline"
					keyTimes="0;1"
					keySplines="0.16 1 0.3 1"
					repeatCount="indefinite"
				/>
				<animate
					attributeName="x2"
					values={coords.x2}
					dur="{duration}s"
					begin="{delay}s"
					calcMode="spline"
					keyTimes="0;1"
					keySplines="0.16 1 0.3 1"
					repeatCount="indefinite"
				/>
				<stop stop-color={gradientStartColor} stop-opacity="0"></stop>
				<stop stop-color={gradientStartColor}></stop>
				<stop offset="32.5%" stop-color={gradientStopColor}></stop>
				<stop offset="100%" stop-color={gradientStopColor} stop-opacity="0"></stop>
			</linearGradient>
		</defs>
	{/if}
</svg>

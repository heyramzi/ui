<svelte:options namespace="svg" />

<script lang="ts">
interface Props {
	id: string;
	from: { x: number; y: number };
	to: { x: number; y: number };
	fromColor: string;
	toColor: string;
}

let { id, from, to, fromColor, toColor }: Props = $props();

// A zero-length gradient paints nothing, so a link drawn onto itself keeps one pixel of run.
let flat = $derived(Math.abs(from.x - to.x) < 0.5 && Math.abs(from.y - to.y) < 0.5);
</script>

<defs>
	<linearGradient
		{id}
		gradientUnits="userSpaceOnUse"
		x1={from.x}
		y1={from.y}
		x2={flat ? from.x : to.x}
		y2={flat ? from.y + 1 : to.y}
	>
		<stop stop-color={fromColor} />
		<stop offset="1" stop-color={toColor} />
	</linearGradient>
</defs>

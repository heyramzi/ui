<script lang="ts">
// =========================
// IMPORTS
// =========================
import { ICON_PATHS, type IconName } from "#src/canvas/ui/icons.js";

// =========================
// PROPS
// =========================
let { name, size = 18 }: { name: IconName; size?: number } = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each ICON_PATHS[name] as d (d)}
		<path {d} />
	{/each}
</svg>

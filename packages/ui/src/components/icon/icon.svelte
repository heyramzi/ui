<script lang="ts">
import type { PhosphorIcon, IconWeight } from "#src/lib/icon-types.js";

// =========================
// TYPES
// =========================
type Props = {
	icon: PhosphorIcon;
	size?: number;
	class?: string;
	weight?: IconWeight;
};

// =========================
// PROPS
// =========================
let { icon: IconComp, size = 24, class: className = "", weight }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<IconComp {size} class={className} {weight} />

<script lang="ts">
// =========================
// IMPORTS
// =========================
import { CaretRight } from "phosphor-svelte";
import { cn } from "@heyramzi/utils";

// =========================
// TYPES
// =========================
interface Props {
	class?: string;
};

// =========================
// PROPS
// =========================
let { class: className }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<CaretRight
	class={cn("size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100", className)}
	weight="bold"
	aria-hidden="true"
/>

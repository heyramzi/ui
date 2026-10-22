<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Handle, Position } from "@xyflow/svelte";

	// =========================
	// CONSTANTS
	// =========================
	// Each side has an invisible source over the visible target. An edge saved without handle ids takes the first, so top and bottom stay first.
	const SIDES = [
		{ id: "top", position: Position.Top },
		{ id: "bottom", position: Position.Bottom },
		{ id: "left", position: Position.Left },
		{ id: "right", position: Position.Right },
	] as const;

	// =========================
	// PROPS
	// =========================
	let { class: className = "" }: { class?: string } = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#each SIDES as side (side.id)}
	<Handle type="target" position={side.position} id={side.id} class="cv-handle {className}" />
	<Handle
		type="source"
		position={side.position}
		id={side.id}
		class="cv-handle !opacity-0 {className}"
	/>
{/each}

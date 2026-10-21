<script lang="ts">
	// =========================
	// IMPORTS
	// =========================

	import "#src/ai/voice-waveform/VoiceWaveform.css";
	import { cn } from "#src/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	// =========================
	// TYPES
	// =========================

	export interface VoiceWaveformProps extends HTMLAttributes<HTMLDivElement> {
		active?: boolean;
		class?: string;
		bars?: readonly number[];
	}

	// =========================
	// CONSTANTS
	// =========================

	const DEFAULT_BARS = [10, 18, 26, 16, 22, 12] as const;

	// =========================
	// PROPS
	// =========================

	let {
		active = false,
		class: className,
		bars = DEFAULT_BARS,
		...rest
	}: VoiceWaveformProps = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->

<div class={cn("waveform", className)} class:active aria-hidden="true" {...rest}>
	{#each bars as height, index (index)}
		<span style={`--bar-height: ${height}px; --delay: ${index * 70}ms`}></span>
	{/each}
</div>

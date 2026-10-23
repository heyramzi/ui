<script lang="ts">
	import { cn } from "#src/lib/utils.js";

	interface Props {
		/** Pulses while true. The dot takes its color from the text around it. */
		running?: boolean;
		size?: number;
		class?: string;
	}

	let { running = false, size = 8, class: className }: Props = $props();
</script>

<span
	class={cn("time-dot", running && "is-running", className)}
	style:--time-dot-size="{size}px"
	aria-hidden="true"
></span>

<style>
	.time-dot {
		position: relative;
		display: inline-block;
		flex: none;
		width: var(--time-dot-size);
		height: var(--time-dot-size);
		border-radius: 9999px;
		background: currentColor;
	}

	.time-dot.is-running::after {
		content: "";
		position: absolute;
		inset: 0;
		border-radius: inherit;
		background: currentColor;
		animation: time-dot-pulse var(--time-pulse-duration, 2000ms) var(--ease-out, ease-out) infinite;
	}

	@keyframes time-dot-pulse {
		from {
			transform: scale(1);
			opacity: 0.45;
		}
		to {
			transform: scale(2.8);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.time-dot.is-running::after {
			animation: none;
			transform: scale(1.9);
			opacity: 0.25;
		}
	}
</style>

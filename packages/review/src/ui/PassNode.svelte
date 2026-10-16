<script lang="ts">
	import type { PassState } from "#src/core/types.js";
	import Icon from "#src/components/icons/Icon.svelte";

	/** The state of a pass as one small mark: a tick, its number, a pulse, a warning ring. */
	let { state, n, live = true }: { state: PassState; n?: number; live?: boolean } = $props();
</script>

<span class="node s-{state}" class:live>
	{#key state}
		<span class="face">
			{#if state === "done"}<Icon name="check" small />
			{:else if state === "blocked"}<Icon name="x" small />
			{:else if state === "started"}<i class="core"></i>
			{:else if state === "review"}<i class="core"></i>
			{:else if n !== undefined}<span class="n num">{n}</span>{/if}
		</span>
	{/key}
</span>

<style>
	.node {
		position: relative;
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 1.5px solid var(--line-strong);
		color: var(--dim);
		transition:
			background-color var(--duration-fast) var(--ease-smooth-out),
			border-color var(--duration-fast) var(--ease-smooth-out),
			color var(--duration-fast) var(--ease-smooth-out);
	}
	.face {
		display: grid;
		place-items: center;
		animation: rv-swap var(--duration-fast) var(--ease-in-out) both;
	}
	.n {
		font: 600 var(--fs-xs) / 1 var(--mono);
	}
	.core {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
	}
	.s-done {
		background: var(--ok);
		border-color: var(--ok);
		color: var(--ground);
	}
	.s-started {
		border-color: var(--accent);
		color: var(--accent);
	}
	.s-started.live::after {
		content: "";
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		border: 1.5px solid var(--accent);
		animation: ring var(--pulse-dur) var(--ease-out) infinite;
	}
	.s-review {
		/* WHY: --warn is a fill colour and fades on the pale light rail, so the ring uses the text tone. */
		border-color: var(--warn-text);
		color: var(--warn-text);
		box-shadow: 0 0 0 3px color-mix(in oklab, var(--warn) 26%, var(--surface));
	}
	.s-blocked {
		background: var(--bad);
		border-color: var(--bad);
		color: var(--ground);
	}
	@keyframes ring {
		from {
			opacity: 0.7;
			scale: 0.7;
		}
		to {
			opacity: 0;
			scale: 1.3;
		}
	}
</style>

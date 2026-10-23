<script lang="ts">
	import type { SaveStatus } from "#src/hooks/review.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import Swap from "#src/ui/Swap.svelte";

	let { status, onretry }: { status: SaveStatus; onretry: () => void } = $props();

	const TEXT: Record<SaveStatus, string> = {
		idle: "",
		saving: "Saving",
		saved: "Saved",
		error: "Couldn't save",
	};
	// WHY: keep the last words while the row folds shut, so it doesn't empty out mid-animation.
	let last = $state<SaveStatus>("saving");
	$effect(() => {
		if (status !== "idle") last = status;
	});
</script>

<div
	class="save"
	class:open={status !== "idle"}
	data-state={status}
	role="status"
	aria-live="polite"
	aria-hidden={status === "idle"}
>
	<div class="fold">
		<span class="item tone-{last === 'error' ? 'bad' : last === 'saved' ? 'ok' : 'neutral'}">
			<span class="glyph">
				{#key last}
					<span class="g">
						{#if last === "saving"}<span class="spin"></span>{:else if last === "saved"}<Icon
								name="check"
								small
							/>{:else}<Icon name="alert" small />{/if}
					</span>
				{/key}
			</span>
			<Swap value={TEXT[last]} />
			{#if last === "error"}<button class="btn retry" onclick={onretry}>Retry</button>{/if}
		</span>
	</div>
</div>

<style>
	.save {
		display: grid;
		grid-template-columns: 0fr;
		opacity: 0;
		transition:
			grid-template-columns var(--duration-fast) var(--ease-smooth-out),
			opacity var(--duration-fast) var(--ease-smooth-out);
	}
	.save.open {
		grid-template-columns: 1fr;
		opacity: 1;
	}
	.fold {
		min-width: 0;
		overflow: hidden;
	}
	.item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0 4px;
		color: var(--tone);
		font-size: var(--fs-xs);
		white-space: nowrap;
	}
	.glyph {
		display: inline-grid;
		place-items: center;
		width: 14px;
		height: 14px;
	}
	.g {
		display: inline-grid;
		animation: rv-swap var(--icon-swap-dur, var(--duration-fast)) var(--ease-in-out) both;
	}
	.spin {
		width: 11px;
		height: 11px;
		border-radius: 50%;
		border: 1.75px solid var(--line-strong);
		border-top-color: var(--dim);
		animation: spin var(--duration-loop) var(--ease-linear) infinite;
	}
	.retry {
		min-height: 22px;
		padding: 0 7px;
		color: var(--text);
	}
	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}
	@media (max-width: 760px) {
		.item :global(.swap) {
			display: none;
		}
	}
</style>

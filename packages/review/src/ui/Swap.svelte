<script lang="ts">
	/** Text that changed slides in and un-blurs. The first paint stays still. */
	let { value, class: className = "" }: { value: string | number; class?: string } = $props();
	// WHY: a plain object, not $state, so a span reads the gate once when it is created and never replays.
	const gate = { armed: false };

	$effect(() => {
		const frame = requestAnimationFrame(() => (gate.armed = true));
		return () => cancelAnimationFrame(frame);
	});
</script>

{#key value}<span class="swap num {className}" class:go={gate.armed}>{value}</span>{/key}

<style>
	.swap {
		display: inline-block;
	}
	.swap.go {
		animation: rv-swap var(--text-swap-dur) var(--ease-in-out) both;
	}
</style>

<script lang="ts">
	import { finalButton, finalRoute } from "#src/core/draft.js";
	import { hostPost } from "#src/core/openscreen.js";
	import { useApp } from "#src/hooks/app.svelte.js";

	const app = useApp();
	const model = $derived(app.review.model);
	const button = $derived(model?.render ? finalButton(model.render.final) : null);

	let asking = $state(false);
	let error = $state("");

	async function ask() {
		if (!model || asking) return;
		asking = true;
		error = "";
		const result = await hostPost(finalRoute(model.id), { kind: "final" });
		// The host's reason is for the agent; the button only says it didn't start.
		if (!result.ok) error = "Couldn't start the final. Try again.";
		asking = false;
	}
</script>

{#if button}
	<button
		class="btn"
		disabled={button.disabled || asking}
		data-tip={error || button.tip}
		onclick={() => void ask()}
	>
		{button.label}
	</button>
{/if}

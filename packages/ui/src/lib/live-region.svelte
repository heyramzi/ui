<script lang="ts">
	import { tick } from "svelte";

	let message = $state("");

	/** Reads text out politely. Clearing first makes the same words read again. */
	export async function announce(text: string): Promise<void> {
		message = "";
		await tick();
		message = text;
	}
</script>

<div class="sr-only" role="status" aria-live="polite">{message}</div>

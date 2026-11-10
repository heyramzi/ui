<script lang="ts">
	import { tick } from "svelte";

	interface Props {
		/** Drives the region from state: whatever it holds is what gets read. Leave it out to use `announce`. */
		message?: string;
	}

	let { message }: Props = $props();

	let spoken = $state("");

	/** Reads text out politely. Clearing first makes the same words read again. */
	export async function announce(text: string): Promise<void> {
		spoken = "";
		await tick();
		spoken = text;
	}
</script>

<!-- A span, so it can sit inside a button. sr-only takes it out of the flow either way. -->
<span class="sr-only" role="status" aria-live="polite">{message ?? spoken}</span>

<script lang="ts">
	import { VoiceWaveform } from "#src/ai/index.js";

	let active = $state(true);
</script>

<button type="button" class="c" onclick={() => (active = !active)}>
	<VoiceWaveform {active} />
</button>

<style>
	.c {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 5rem;
		background: none;
		border: none;
		padding: 0;
		color: var(--primary);
		cursor: pointer;
	}
</style>

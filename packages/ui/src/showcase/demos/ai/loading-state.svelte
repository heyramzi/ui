<script lang="ts">
	import { PixelLoader } from "#src/ai/index.js";
</script>

<div class="stack">
	<PixelLoader label="Reading the workspace" />
	<PixelLoader label="Writing the migration" startSeconds={47} />
	<PixelLoader label="Waiting on the tool" elapsed={false} />
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.875rem;
		width: 100%;
	}
</style>

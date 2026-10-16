<script lang="ts">
	import {
		Confirmation,
		ConfirmationTitle,
		ConfirmationRequest,
		ConfirmationAccepted,
		ConfirmationRejected,
		ConfirmationActions,
		ConfirmationAction,
		type ConfirmationState,
	} from "#src/ai/index.js";

	let kind = $state<ConfirmationState>("requested");
</script>

<div class="stack">
	<Confirmation {kind}>
		<ConfirmationTitle>Delete 3 stale views?</ConfirmationTitle>
		<ConfirmationRequest>
			<p class="body">Removes the views from the workspace. This can't be undone.</p>
			<ConfirmationActions>
				<ConfirmationAction variant="outline" onclick={() => (kind = "rejected")}>
					Cancel
				</ConfirmationAction>
				<ConfirmationAction onclick={() => (kind = "accepted")}>Delete</ConfirmationAction>
			</ConfirmationActions>
		</ConfirmationRequest>
		<ConfirmationAccepted>Deleted 3 views.</ConfirmationAccepted>
		<ConfirmationRejected>Kept the views.</ConfirmationRejected>
	</Confirmation>

	{#if kind !== "requested"}
		<button type="button" class="reset" onclick={() => (kind = "requested")}>Reset</button>
	{/if}
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		width: 100%;
	}
	.body {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--muted-foreground);
	}
	.reset {
		align-self: flex-start;
		padding: 0.375rem 0.75rem;
		font-size: 0.75rem;
		color: var(--foreground);
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		cursor: pointer;
	}
</style>

<script lang="ts">
	import {
		Confirmation,
		ConfirmationTitle,
		ConfirmationState,
		ConfirmationActions,
		ConfirmationAction,
		type ConfirmationKind,
	} from "@heyramzi/ui/ai/confirmation";

	let kind = $state<ConfirmationKind>("requested");
</script>

<div class="stack">
	<Confirmation {kind}>
		<ConfirmationTitle>Delete 3 stale views?</ConfirmationTitle>
		<ConfirmationState when="requested">
			<p class="body">Removes the views from the workspace. This can't be undone.</p>
			<ConfirmationActions>
				<ConfirmationAction variant="outline" onclick={() => (kind = "rejected")}>
					Cancel
				</ConfirmationAction>
				<ConfirmationAction onclick={() => (kind = "accepted")}>Delete</ConfirmationAction>
			</ConfirmationActions>
		</ConfirmationState>
		<ConfirmationState when="accepted">Deleted 3 views.</ConfirmationState>
		<ConfirmationState when="rejected">Kept the views.</ConfirmationState>
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

<script lang="ts">
	// A request whose Delete runs, then resolves, for the focus and live region test.
	import {
		Confirmation,
		ConfirmationAction,
		ConfirmationActions,
		ConfirmationState,
		type ConfirmationKind,
	} from "#src/ai/confirmation/index.js";

	let { onDelete }: { onDelete: () => void } = $props();
	let kind = $state<ConfirmationKind>("requested");
	let executing = $state(false);

	export function resolve() {
		executing = false;
		kind = "accepted";
	}
</script>

<Confirmation {kind} {executing}>
	<ConfirmationState when="requested">
		<ConfirmationActions>
			<ConfirmationAction
				onclick={() => {
					executing = true;
					onDelete();
				}}>Delete</ConfirmationAction
			>
		</ConfirmationActions>
	</ConfirmationState>
	<ConfirmationState when="accepted">Deleted.</ConfirmationState>
</Confirmation>

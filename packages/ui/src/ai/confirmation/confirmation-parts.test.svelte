<script lang="ts">
	// Every state part under one Confirmation, for the state-swap test.
	import {
		Confirmation,
		ConfirmationState,
		type ConfirmationKind,
	} from "#src/ai/confirmation/index.js";

	let { kind }: { kind: ConfirmationKind } = $props();
</script>

<Confirmation {kind}>
	<ConfirmationState when="requested">request</ConfirmationState>
	<ConfirmationState when="accepted">accepted</ConfirmationState>
	<ConfirmationState when="rejected">rejected</ConfirmationState>
	<ConfirmationState when="failed">failed</ConfirmationState>
</Confirmation>

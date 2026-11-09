<script lang="ts">
	// Every state part under one Confirmation, for the state-swap test.
	import {
		Confirmation,
		ConfirmationAccepted,
		ConfirmationFailed,
		ConfirmationRejected,
		ConfirmationRequest,
		type ConfirmationState,
	} from "#src/ai/confirmation/index.js";

	let { kind }: { kind: ConfirmationState } = $props();
</script>

<Confirmation {kind}>
	<ConfirmationRequest>request</ConfirmationRequest>
	<ConfirmationAccepted>accepted</ConfirmationAccepted>
	<ConfirmationRejected>rejected</ConfirmationRejected>
	<ConfirmationFailed>failed</ConfirmationFailed>
</Confirmation>

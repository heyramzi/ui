<script lang="ts">
	import { SimpleField } from "@heyramzi/ui/shadcn/field";
	import { Input } from "@heyramzi/ui/shadcn/input";

	let email = $state("team@");
	let error = $derived(
		email.includes("@") && email.split("@")[1] ? undefined : "Enter a full email address",
	);
</script>

<div class="w-72">
	<SimpleField label="Email" for="field-demo-email" description="We reply within a day." {error}>
		<Input id="field-demo-email" bind:value={email} />
	</SimpleField>
</div>

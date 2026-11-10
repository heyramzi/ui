<script lang="ts">
	import * as Field from "@heyramzi/ui/shadcn/field";
	import * as Select from "@heyramzi/ui/shadcn/select";

	const roles = [
		{ value: "admin", label: "Admin" },
		{ value: "member", label: "Member" },
		{ value: "viewer", label: "Viewer" },
	];

	let value = $state("");
</script>

<Field.Field class="max-w-[220px]" data-invalid="true">
	<Field.Label for="example-role">Role</Field.Label>
	<Select.Root type="single" items={roles} bind:value>
		<Select.Trigger
			id="example-role"
			class="w-full"
			aria-invalid="true"
			aria-describedby="example-role-error"
		>
			{roles.find((role) => role.value === value)?.label ?? "Pick a role"}
		</Select.Trigger>
		<Select.Content>
			{#each roles as role (role.value)}
				<Select.Item value={role.value} label={role.label} />
			{/each}
		</Select.Content>
	</Select.Root>
	<Field.Error id="example-role-error">Every invite needs a role.</Field.Error>
</Field.Field>

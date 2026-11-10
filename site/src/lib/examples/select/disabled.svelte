<script lang="ts">
	import * as Select from "@heyramzi/ui/shadcn/select";

	const plans = [
		{ value: "free", label: "Free" },
		{ value: "pro", label: "Pro" },
		{ value: "team", label: "Team", disabled: true },
	];

	let value = $state("free");
</script>

<div class="flex flex-wrap items-center justify-center gap-3">
	<Select.Root type="single" items={plans} value="pro" disabled>
		<Select.Trigger class="w-[160px]" aria-label="Plan">Pro</Select.Trigger>
	</Select.Root>
	<Select.Root type="single" items={plans} bind:value>
		<Select.Trigger class="w-[160px]" aria-label="Plan">
			{plans.find((plan) => plan.value === value)?.label}
		</Select.Trigger>
		<Select.Content>
			{#each plans as plan (plan.value)}
				<Select.Item value={plan.value} label={plan.label} disabled={plan.disabled} />
			{/each}
		</Select.Content>
	</Select.Root>
</div>

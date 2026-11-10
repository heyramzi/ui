<script lang="ts">
	import { tick } from "svelte";
	import { CaretUpDown, Check } from "phosphor-svelte";
	import * as Command from "@heyramzi/ui/shadcn/command";
	import * as Popover from "@heyramzi/ui/shadcn/popover";
	import { Button } from "@heyramzi/ui/shadcn/button";

	const zones = [
		{ value: "europe/lisbon", label: "Lisbon" },
		{ value: "europe/paris", label: "Paris" },
		{ value: "europe/london", label: "London" },
		{ value: "america/new_york", label: "New York" },
		{ value: "america/sao_paulo", label: "São Paulo" },
		{ value: "asia/tokyo", label: "Tokyo" },
	];

	let open = $state(false);
	let value = $state("");
	let trigger = $state<HTMLButtonElement | null>(null);
	const picked = $derived(zones.find((zone) => zone.value === value)?.label);

	// Picking closes the list and hands focus back to the trigger, so the keyboard stays put.
	function choose(next: string) {
		value = next;
		open = false;
		tick().then(() => trigger?.focus());
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger bind:ref={trigger}>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				class="w-52 justify-between font-normal"
				role="combobox"
				aria-label={picked ? `Time zone: ${picked}` : "Time zone"}
				aria-expanded={open}
			>
				<span class={[!picked && "text-muted-foreground"]}>{picked ?? "Pick a time zone"}</span>
				<CaretUpDown aria-hidden="true" class="opacity-50" />
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-52 p-0">
		<Command.Root>
			<Command.Input placeholder="Search cities" />
			<Command.List>
				<Command.Empty>No city by that name.</Command.Empty>
				<Command.Group>
					{#each zones as zone (zone.value)}
						<Command.Item value={zone.label} onSelect={() => choose(zone.value)}>
							<Check aria-hidden="true" class={[value !== zone.value && "text-transparent"]} />
							{zone.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

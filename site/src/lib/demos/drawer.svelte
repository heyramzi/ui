<script lang="ts">
	import * as Drawer from "@heyramzi/ui/shadcn/drawer";
	import * as Field from "@heyramzi/ui/shadcn/field";
	import * as RadioGroup from "@heyramzi/ui/shadcn/radio-group";
	import { IsMobile } from "@heyramzi/ui/shadcn/hooks/is-mobile.svelte";
	import { Badge } from "@heyramzi/ui/shadcn/badge";
	import { Button, buttonVariants } from "@heyramzi/ui/shadcn/button";

	const times = [
		{ value: "evening", label: "This evening", hint: "Back at 6 PM", badge: "Most used" },
		{ value: "tomorrow", label: "Tomorrow morning", hint: "Back at 9 AM" },
		{ value: "monday", label: "Next Monday", hint: "Back at 9 AM, start of the week" },
		{ value: "month", label: "In a month", hint: "Back on the same date next month" },
	];

	let open = $state(false);
	let snooze = $state("evening");
	let picked = $state<string>();
	// A sheet from the bottom under a thumb, a side panel under a mouse.
	const isMobile = new IsMobile();

	function confirm() {
		picked = times.find((time) => time.value === snooze)?.label;
		open = false;
	}
</script>

<div class="flex flex-col items-center gap-3">
	<Drawer.Root bind:open direction={isMobile.current ? "bottom" : "right"}>
		<Drawer.Trigger class={buttonVariants({ variant: "outline" })}
			>Snooze this thread</Drawer.Trigger
		>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>Snooze until</Drawer.Title>
				<Drawer.Description>The thread leaves the inbox and comes back then.</Drawer.Description>
			</Drawer.Header>
			<div class="flex-1 overflow-y-auto p-4">
				<RadioGroup.Root bind:value={snooze} class="gap-2" aria-label="Snooze until">
					{#each times as time (time.value)}
						<Field.Label for="snooze-{time.value}">
							<Field.Field orientation="horizontal">
								<Field.Content>
									<Field.Title class="flex items-center gap-2">
										{time.label}
										{#if time.badge}
											<Badge variant="secondary">{time.badge}</Badge>
										{/if}
									</Field.Title>
									<Field.Description>{time.hint}</Field.Description>
								</Field.Content>
								<RadioGroup.Item value={time.value} id="snooze-{time.value}" />
							</Field.Field>
						</Field.Label>
					{/each}
				</RadioGroup.Root>
			</div>
			<Drawer.Footer>
				<Button onclick={confirm}>Snooze</Button>
				<Drawer.Close class={buttonVariants({ variant: "outline" })}>Cancel</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
	<p class="text-muted-foreground min-h-5 text-sm" aria-live="polite">
		{#if picked}Snoozed until {picked.toLowerCase()}.{/if}
	</p>
</div>

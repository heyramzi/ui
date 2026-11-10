<script lang="ts">
	import { Archive, ArrowLeft, CalendarPlus, Clock, DotsThree, EnvelopeSimpleOpen, FunnelSimple, Tag, Trash } from "phosphor-svelte";
	import * as ButtonGroup from "@heyramzi/ui/shadcn/button-group";
	import * as DropdownMenu from "@heyramzi/ui/shadcn/dropdown-menu";
	import { Button } from "@heyramzi/ui/shadcn/button";

	let label = $state("personal");
</script>

<ButtonGroup.Root>
	<ButtonGroup.Root class="hidden sm:flex">
		<Button variant="outline" icon aria-label="Go Back">
			<ArrowLeft aria-hidden="true" />
		</Button>
	</ButtonGroup.Root>
	<ButtonGroup.Root>
		<Button variant="outline">Archive</Button>
		<Button variant="outline">Report</Button>
	</ButtonGroup.Root>
	<ButtonGroup.Root>
		<Button variant="outline">Snooze</Button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" icon aria-label="More Options">
						<DotsThree aria-hidden="true" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" class="w-40">
				<DropdownMenu.Group>
					<DropdownMenu.Item>
						<EnvelopeSimpleOpen aria-hidden="true" />
						Mark as Read
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<Archive aria-hidden="true" />
						Archive
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item>
						<Clock aria-hidden="true" />
						Snooze
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<CalendarPlus aria-hidden="true" />
						Add to Calendar
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<FunnelSimple aria-hidden="true" />
						Add to List
					</DropdownMenu.Item>
					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger>
							<Tag aria-hidden="true" />
							Label As...
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent>
							<DropdownMenu.RadioGroup bind:value={label}>
								<DropdownMenu.RadioItem value="personal">Personal</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="work">Work</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="other">Other</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item variant="destructive">
						<Trash aria-hidden="true" />
						Trash
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</ButtonGroup.Root>
</ButtonGroup.Root>

<script lang="ts">
	import { Calculator, CalendarBlank, CreditCard, Gear, Smiley, User } from "phosphor-svelte";
	import * as Command from "@heyramzi/ui/shadcn/command";
</script>

<Command.Root class="rounded-lg border shadow-md md:min-w-[450px]">
	<Command.Input placeholder="Type a command or search..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		<Command.Group heading="Suggestions">
			<Command.Item>
				<CalendarBlank aria-hidden="true" />
				<span>Calendar</span>
			</Command.Item>
			<Command.Item>
				<Smiley aria-hidden="true" />
				<span>Search Emoji</span>
			</Command.Item>
			<Command.Item disabled>
				<Calculator aria-hidden="true" />
				<span>Calculator</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Settings">
			<Command.Item>
				<User aria-hidden="true" />
				<span>Profile</span>
				<Command.Shortcut>⌘P</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<CreditCard aria-hidden="true" />
				<span>Billing</span>
				<Command.Shortcut>⌘B</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<Gear aria-hidden="true" />
				<span>Settings</span>
				<Command.Shortcut>⌘S</Command.Shortcut>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Root>

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
				<CalendarBlank />
				<span>Calendar</span>
			</Command.Item>
			<Command.Item>
				<Smiley />
				<span>Search Emoji</span>
			</Command.Item>
			<Command.Item disabled>
				<Calculator />
				<span>Calculator</span>
			</Command.Item>
		</Command.Group>
		<Command.Separator />
		<Command.Group heading="Settings">
			<Command.Item>
				<User />
				<span>Profile</span>
				<Command.Shortcut>⌘P</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<CreditCard />
				<span>Billing</span>
				<Command.Shortcut>⌘B</Command.Shortcut>
			</Command.Item>
			<Command.Item>
				<Gear />
				<span>Settings</span>
				<Command.Shortcut>⌘S</Command.Shortcut>
			</Command.Item>
		</Command.Group>
	</Command.List>
</Command.Root>

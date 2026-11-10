<script lang="ts">
	import { Kanban, ListBullets, CalendarBlank } from "phosphor-svelte";
	import * as Tabs from "@heyramzi/ui/shadcn/tabs";
</script>

<Tabs.Root value="list" class="w-full max-w-sm">
	<Tabs.List>
		<Tabs.Trigger value="list"><ListBullets aria-hidden="true" />List</Tabs.Trigger>
		<Tabs.Trigger value="board"><Kanban aria-hidden="true" />Board</Tabs.Trigger>
		<Tabs.Trigger value="calendar"><CalendarBlank aria-hidden="true" />Calendar</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="list" class="text-muted-foreground text-sm"
		>Every task in one long list.</Tabs.Content
	>
	<Tabs.Content value="board" class="text-muted-foreground text-sm"
		>Tasks in lanes by status.</Tabs.Content
	>
	<Tabs.Content value="calendar" class="text-muted-foreground text-sm"
		>Tasks on the day they're due.</Tabs.Content
	>
</Tabs.Root>

<script lang="ts">
	import * as Tabs from "@heyramzi/ui/shadcn/tabs";
</script>

<Tabs.Root value="profile" class="w-full max-w-sm">
	<Tabs.List>
		<Tabs.Trigger value="profile">Profile</Tabs.Trigger>
		<Tabs.Trigger value="billing" disabled>Billing</Tabs.Trigger>
		<Tabs.Trigger value="team">Team</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="profile" class="text-muted-foreground text-sm"
		>Your name, photo and email.</Tabs.Content
	>
	<Tabs.Content value="team" class="text-muted-foreground text-sm"
		>Who can see this workspace.</Tabs.Content
	>
</Tabs.Root>

<script lang="ts">
	import * as Sidebar from "@heyramzi/ui/shadcn/sidebar";
	import { ChartBar, Gear, House, Tray, Users } from "phosphor-svelte";

	const rows = [
		{ title: "Home", icon: House },
		{ title: "Inbox", icon: Tray, badge: "4" },
		{ title: "Clients", icon: Users },
		{ title: "Reports", icon: ChartBar },
	];
	let active = $state("Home");
</script>

<!-- `collapsible="none"` keeps the rail in the box: the other modes pin it to the window. -->
<Sidebar.Provider
	style="--sidebar-width: 11rem"
	class="h-88 w-full max-w-2xl rounded-xl border border-border"
>
	<Sidebar.Root collapsible="none" class="border-r border-sidebar-border">
		<Sidebar.Header>
			<span class="px-2 py-1 text-sm font-semibold">Acme</span>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each rows as row (row.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={active === row.title}
									onclick={() => (active = row.title)}
								>
									<row.icon />
									<span>{row.title}</span>
								</Sidebar.MenuButton>
								{#if row.badge}<Sidebar.MenuBadge>{row.badge}</Sidebar.MenuBadge>{/if}
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>
		<Sidebar.Footer>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						isActive={active === "Settings"}
						onclick={() => (active = "Settings")}
					>
						<Gear />
						<span>Settings</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	</Sidebar.Root>
	<Sidebar.Inset class="min-w-0 p-4 sm:p-6">
		<h3 class="text-base font-semibold">{active}</h3>
		<p class="mt-1 hidden text-sm text-muted-foreground sm:block">
			The page sits in the inset, beside the rail.
		</p>
	</Sidebar.Inset>
</Sidebar.Provider>

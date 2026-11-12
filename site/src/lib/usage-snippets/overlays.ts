/** Usage snippets for Overlays and Navigation pages, by slug. */
export const overlays: Record<string, string> = {
  drawer: `
<Drawer.Root direction="bottom">
  <Drawer.Trigger>Snooze</Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>Snooze until</Drawer.Title>
      <Drawer.Description>The thread comes back then.</Drawer.Description>
    </Drawer.Header>
    <Drawer.Footer>
      <Drawer.Close>Cancel</Drawer.Close>
    </Drawer.Footer>
  </Drawer.Content>
</Drawer.Root>`,

  pagination: `
<Pagination.Root count={100} perPage={10}>
  {#snippet children({ pages, currentPage })}
    <Pagination.Content>
      <Pagination.Item><Pagination.Previous /></Pagination.Item>
      {#each pages as page (page.key)}
        <Pagination.Item>
          {#if page.type === "ellipsis"}
            <Pagination.Ellipsis />
          {:else}
            <Pagination.Link {page} isActive={currentPage === page.value}>{page.value}</Pagination.Link>
          {/if}
        </Pagination.Item>
      {/each}
      <Pagination.Item><Pagination.Next /></Pagination.Item>
    </Pagination.Content>
  {/snippet}
</Pagination.Root>`,

  tooltip: `
<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger>Hover</Tooltip.Trigger>
    <Tooltip.Content>Add to library</Tooltip.Content>
  </Tooltip.Root>
</Tooltip.Provider>`,

  "hover-card": `
<HoverCard.Root>
  <HoverCard.Trigger href="https://github.com/sveltejs">@sveltejs</HoverCard.Trigger>
  <HoverCard.Content>Cybernetically enhanced web apps.</HoverCard.Content>
</HoverCard.Root>`,

  popover: `
<Popover.Root>
  <Popover.Trigger>Open popover</Popover.Trigger>
  <Popover.Content>Set the dimensions for the layer.</Popover.Content>
</Popover.Root>`,

  "dropdown-menu": `
<DropdownMenu.Root>
  <DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
  <DropdownMenu.Content align="start">
    <DropdownMenu.Label>My account</DropdownMenu.Label>
    <DropdownMenu.Group>
      <DropdownMenu.Item>
        Profile
        <DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
      </DropdownMenu.Item>
      <DropdownMenu.Item>Billing</DropdownMenu.Item>
    </DropdownMenu.Group>
    <DropdownMenu.Separator />
    <DropdownMenu.Item>Log out</DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>`,

  "context-menu": `
<ContextMenu.Root>
  <ContextMenu.Trigger>Right click here</ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item>
      Back
      <ContextMenu.Shortcut>⌘[</ContextMenu.Shortcut>
    </ContextMenu.Item>
    <ContextMenu.Item>Reload</ContextMenu.Item>
    <ContextMenu.Separator />
    <ContextMenu.CheckboxItem bind:checked={showBookmarks}>Show bookmarks</ContextMenu.CheckboxItem>
  </ContextMenu.Content>
</ContextMenu.Root>`,

  dialog: `
<Dialog.Root>
  <Dialog.Trigger>Add project</Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Add project</Dialog.Title>
      <Dialog.Description>It shows up on the board right away.</Dialog.Description>
    </Dialog.Header>
    <Dialog.Body>
      <input aria-label="Company" placeholder="Acme Corp" />
    </Dialog.Body>
    <Dialog.Footer band>
      <Dialog.Close>Cancel</Dialog.Close>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>`,

  "alert-dialog": `
<AlertDialog.Root>
  <AlertDialog.Trigger>Delete project</AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>This action cannot be undone.</AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>`,

  sheet: `
<Sheet.Root>
  <Sheet.Trigger>Edit client</Sheet.Trigger>
  <Sheet.Content side="right">
    <Sheet.Header>
      <Sheet.Title>Edit client</Sheet.Title>
      <Sheet.Description>Shown on invoices and the portal.</Sheet.Description>
    </Sheet.Header>
    <Sheet.Body>
      <input aria-label="Name" value="Acme Corp" />
    </Sheet.Body>
    <Sheet.Footer band>
      <Sheet.Close>Cancel</Sheet.Close>
    </Sheet.Footer>
  </Sheet.Content>
</Sheet.Root>`,

  command: `
<Command.Root>
  <Command.Input placeholder="Type a command or search..." />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>
    <Command.Group heading="Suggestions">
      <Command.Item>Calendar</Command.Item>
      <Command.Item>Search emoji</Command.Item>
    </Command.Group>
    <Command.Separator />
    <Command.Group heading="Settings">
      <Command.Item>
        Profile
        <Command.Shortcut>⌘P</Command.Shortcut>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Root>`,

  picker: `
<Picker
  options={[{ value: "high", label: "High", hint: "P1" }]}
  {value}
  onSelect={(next) => (value = next)}
  triggerClass={pickerTriggerClass()}
>
  {#snippet trigger()}
    {selected?.label ?? "Priority"}
  {/snippet}
</Picker>`,

  tabs: `
<Tabs bind:value={tab}>
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">A sliding indicator follows the active tab.</TabsContent>
  <TabsContent value="activity">Nothing here yet.</TabsContent>
</Tabs>`,

  segmented: `
<AnimatedTabs tabs={views} bind:value={tab} ariaLabel="View" />
<SegmentedFilter
  options={[
    { value: "all", label: "All" },
    { value: "open", label: "Open", count: 4 },
  ]}
  bind:value={filter}
  ariaLabel="Status"
/>`,

  breadcrumb: `
<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Link href="/components">Components</Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Page>Breadcrumb</Breadcrumb.Page>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>`,

  toolbar: `
<Toolbar bind:search bind:tab bind:view {tabs} {views}>
  {#snippet actions()}
    <button type="button">New</button>
  {/snippet}
</Toolbar>`,

  sidebar: `
<Sidebar.Provider>
  <Sidebar.Root collapsible="none">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive>Home</Sidebar.MenuButton>
              <Sidebar.MenuBadge>4</Sidebar.MenuBadge>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>
  </Sidebar.Root>
  <Sidebar.Inset>The page sits here.</Sidebar.Inset>
</Sidebar.Provider>`,
};

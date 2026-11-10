/**
 * The smallest markup that works, by page slug, shown under the import line in Usage. Cut from
 * each page's demo; `usage-snippets.test.ts` fails a tag the import doesn't export.
 */
const written: Record<string, string> = {
  "toggle-group": `
<ToggleGroup.Root type="multiple" variant="outline">
  <ToggleGroup.Item value="bold" aria-label="Toggle bold">B</ToggleGroup.Item>
  <ToggleGroup.Item value="italic" aria-label="Toggle italic">I</ToggleGroup.Item>
</ToggleGroup.Root>`,

  alert: `
<Alert.Root>
  <Alert.Title>Your changes have been saved</Alert.Title>
  <Alert.Description>This is an alert with a title and a description.</Alert.Description>
</Alert.Root>
<Alert.Root variant="destructive">
  <Alert.Title>Unable to process your payment.</Alert.Title>
</Alert.Root>`,

  empty: `
<Empty.Root>
  <Empty.Header>
    <Empty.Title>No projects yet</Empty.Title>
    <Empty.Description>Create your first project to get started.</Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <button type="button">Create project</button>
  </Empty.Content>
</Empty.Root>`,

  avatar: `
<Avatar.Root>
  <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
  <Avatar.Fallback>CN</Avatar.Fallback>
</Avatar.Root>`,

  kbd: `
<KbdGroup>
  <Kbd>⌘</Kbd>
  <Kbd>K</Kbd>
</KbdGroup>
<p>Press <Kbd>Esc</Kbd> to close.</p>`,

  "code-block": `
<CodeBlock.Root>
  <CodeBlock.Header>
    <CodeBlock.Title>route.ts</CodeBlock.Title>
    <CodeBlock.Actions>
      <CodeBlock.CopyButton value={code} />
    </CodeBlock.Actions>
  </CodeBlock.Header>
  <CodeBlock.Content {code} lineNumbers />
</CodeBlock.Root>`,

  table: `
<Table.Root>
  <Table.Caption>A list of your recent invoices.</Table.Caption>
  <Table.Header>
    <Table.Row>
      <Table.Head>Invoice</Table.Head>
      <Table.Head>Amount</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    <Table.Row>
      <Table.Cell>INV001</Table.Cell>
      <Table.Cell>$250.00</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table.Root>`,

  "table-view": `
<TableView
  columns={[
    { key: "item", label: "Item" },
    { key: "hours", label: "Hours", numeric: true, width: "6rem" },
  ]}
  rows={lines}
  rowKey={(row) => row.id}
  label="Quote lines"
/>`,

  "data-table": `
<table>
  <thead>
    <tr>
      <SortableHead key="name" {sort} onSort={(key) => (sort = toggleSort(sort, key))}>Client</SortableHead>
      <SortableHead key="revenue" {sort} onSort={(key) => (sort = toggleSort(sort, key))} numeric>Revenue</SortableHead>
    </tr>
  </thead>
  <tbody>
    {#each paginateRows(sortRows(clients, sort), page, pageSize) as row (row.id)}
      <tr><td>{row.name}</td><td>{row.revenue}</td></tr>
    {/each}
  </tbody>
</table>
<Pagination {page} {pageSize} total={clients.length} onPageChange={(p) => (page = p)} />`,

  card: `
<Card>
  <CardHeader>
    <CardTitle>Team plan</CardTitle>
    <CardDescription>Up to 10 seats, billed monthly.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>$49 / month</p>
  </CardContent>
  <CardFooter>
    <button type="button">Upgrade</button>
  </CardFooter>
</Card>`,

  accordion: `
<Accordion.Root type="single">
  <Accordion.Item value="item-1">
    <Accordion.Trigger>How do I install a component?</Accordion.Trigger>
    <Accordion.Content>Copy the source file into your project.</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Trigger>Do the charts need a server?</Accordion.Trigger>
    <Accordion.Content>No. Every chart renders from the data you pass in.</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>`,

  collapsible: `
<Collapsible.Root>
  <Collapsible.Trigger>Show all repositories</Collapsible.Trigger>
  <Collapsible.Content>
    <p>@melt-ui/melt-ui</p>
    <p>@sveltejs/svelte</p>
  </Collapsible.Content>
</Collapsible.Root>`,

  "scroll-area": `
<ScrollArea class="h-72 w-48 rounded-md border">
  {#each tags as tag (tag)}
    <div>{tag}</div>
  {/each}
</ScrollArea>`,

  field: `
<Field.Set>
  <Field.Legend>Payment method</Field.Legend>
  <Field.Description>All transactions are secure and encrypted.</Field.Description>
  <Field.Group>
    <Field.Field>
      <Field.Label for="card-number">Card number</Field.Label>
      <input id="card-number" placeholder="1234 5678 9012 3456" />
      <Field.Description>Enter your 16-digit number.</Field.Description>
    </Field.Field>
  </Field.Group>
</Field.Set>`,

  "simple-field": `
<SimpleField label="Email" for="email" description="We reply within a day." {error}>
  <input id="email" bind:value={email} />
</SimpleField>`,

  "input-otp": `
<InputOTP.Root maxlength={6} aria-label="Verification code">
  {#snippet children({ cells })}
    <InputOTP.Group>
      {#each cells.slice(0, 3) as cell (cell)}
        <InputOTP.Slot {cell} />
      {/each}
    </InputOTP.Group>
    <InputOTP.Separator />
    <InputOTP.Group>
      {#each cells.slice(3, 6) as cell (cell)}
        <InputOTP.Slot {cell} />
      {/each}
    </InputOTP.Group>
  {/snippet}
</InputOTP.Root>`,

  "radio-group": `
<RadioGroup.Root value="comfortable">
  <RadioGroup.Item value="default" id="r1" />
  <label for="r1">Default</label>
  <RadioGroup.Item value="comfortable" id="r2" />
  <label for="r2">Comfortable</label>
</RadioGroup.Root>`,

  slider: `
<Slider type="single" bind:value max={100} step={1} thumbLabel="Volume" />`,

  "tags-input": `
<TagsInput
  value={used}
  options={tools}
  label="Tools"
  labels={{ add: "Add a tool" }}
  onValueChange={(next) => (used = next)}
/>`,

  select: `
<Select.Root type="single" name="theme" bind:value>
  <Select.Trigger aria-label="Theme">{label}</Select.Trigger>
  <Select.Content>
    <Select.Group>
      <Select.Label>Theme</Select.Label>
      <Select.Item value="ink" label="Ink">Ink</Select.Item>
      <Select.Item value="paper" label="Paper">Paper</Select.Item>
    </Select.Group>
  </Select.Content>
</Select.Root>`,

  "native-select": `
<NativeSelect.Root bind:value={status} aria-label="Status">
  <NativeSelect.Option value="todo">To do</NativeSelect.Option>
  <NativeSelect.Option value="done">Done</NativeSelect.Option>
</NativeSelect.Root>`,

  calendar: `
<Calendar type="single" bind:value captionLayout="dropdown" />`,

  "input-group": `
<InputGroup.Root>
  <InputGroup.Addon>
    <InputGroup.Text>https://</InputGroup.Text>
  </InputGroup.Addon>
  <InputGroup.Input placeholder="example.com" />
</InputGroup.Root>`,

  item: `
<Item.Root variant="outline">
  <Item.Content>
    <Item.Title>Two-factor sign-in</Item.Title>
    <Item.Description>A code from your phone at each new sign-in.</Item.Description>
  </Item.Content>
</Item.Root>`,

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

  marquee: `
<Marquee repeat={4} pauseOnHover>
  {#each items as item (item)}
    <span>{item}</span>
  {/each}
</Marquee>
<Marquee overflowOnly class="max-w-56 whitespace-nowrap">{title}</Marquee>`,

  "text-effect": `
<TextEffect text="Ship the thing." per="char" preset="blur-slide" as="h3" onMount />`,

  "animated-beam": `
<div bind:this={container} class="relative">
  <div bind:this={from}>A</div>
  <div bind:this={to}>B</div>
  {#if container && from && to}
    <AnimatedBeam containerRef={container} fromRef={from} toRef={to} />
  {/if}
</div>`,

  "in-view": `
<InView preset="slide" amount={0.4}>
  {#snippet children()}
    <span>Block 1</span>
  {/snippet}
</InView>
<p use:onInView={{ amount: 0.6, onEnter: () => (seen = true) }}>Keep scrolling.</p>`,

  "animated-group": `
<AnimatedGroup preset="blur-slide" stagger={70} onMount>
  {#each rows as row (row)}
    <span>{row}</span>
  {/each}
</AnimatedGroup>`,

  "image-comparison": `
<ImageComparison
  class="aspect-video"
  bind:position
  before={{ src: "/before.png", alt: "The page before the redesign" }}
  after={{ src: "/after.png", alt: "The page after the redesign" }}
/>`,

  magnetic: `
<button use:magnetic={{ intensity: 0.5, range: 130 }}>Book a call</button>`,

  "area-chart": `
<AreaChart
  data={[{ month: "Jan", revenue: 3200, cost: 1800 }]}
  xKey="month"
  series={[
    { key: "revenue", label: "Revenue", color: "var(--chart-1)" },
    { key: "cost", label: "Cost", color: "var(--chart-3)" },
  ]}
  height={260}
/>`,

  "line-chart": `
<LineChart
  data={[{ day: "Mon", visits: 1240, signups: 120 }]}
  xKey="day"
  series={[
    { key: "visits", label: "Visits", color: "var(--chart-1)" },
    { key: "signups", label: "Signups", color: "var(--chart-2)" },
  ]}
  height={260}
/>`,

  "bar-chart": `
<BarChart
  data={[{ plan: "Pro", users: 1480 }]}
  xKey="plan"
  yKey="users"
  yLabel="Users"
  height={260}
/>`,

  "time-series-chart": `
<TimeSeriesChart
  data={[{ date: "2026-07-01", value: 1200, value2: 900 }]}
  label="This period"
  label2="Previous"
  height={280}
/>`,

  "donut-chart": `
<DonutChart
  data={[{ source: "Direct", visits: 4200, color: "var(--chart-1)" }]}
  valueKey="visits"
  labelKey="source"
  colorKey="color"
  centerLabel="Visits"
/>
<Legend items={[{ label: "Direct", value: 4200, color: "var(--chart-1)" }]} showValue />`,

  "ring-chart": `
<RingChart
  data={[{ label: "Move", value: 520, maxValue: 600, color: "var(--chart-4)" }]}
  size={240}
  defaultLabel="Today"
/>`,

  "gauge-chart": `
<div class="size-44">
  <GaugeChart value={72} label="Health" />
</div>`,

  "number-chart": `
<NumberChart
  label="MRR"
  value={18400}
  delta={8.2}
  direction="up-good"
  formatOptions={{ style: "currency", currency: "USD" }}
/>`,

  sparkline: `
<Sparkline data={[{ i: 0, v: 3 }, { i: 1, v: 4.2 }]} xKey="i" yKey="v" showLast />`,

  "stat-card": `
<StatCard
  label="Revenue"
  value={48200}
  delta={12.4}
  caption="vs last month"
  variant="area"
  data={[{ m: "Jan", v: 3200 }]}
  xKey="m"
  yKey="v"
/>`,

  message: `
<Message.Root align="end">
  <Message.Avatar>
    <img src="/avatars/10.png" alt="@me" />
  </Message.Avatar>
  <Message.Content>
    It's a one-line change.
    <Message.Footer>Delivered</Message.Footer>
  </Message.Content>
</Message.Root>`,

  bubble: `
<Bubble.Root align="end">
  <Bubble.Content>Hey there! What's up?</Bubble.Content>
</Bubble.Root>
<Bubble.Group>
  <Bubble.Root variant="muted">
    <Bubble.Content>Hey! Want to see chat bubbles?</Bubble.Content>
  </Bubble.Root>
  <Bubble.Root variant="muted">
    <Bubble.Content>I can group messages and switch sides.</Bubble.Content>
    <Bubble.Reactions role="img" aria-label="2 reactions">
      <span>+2</span>
    </Bubble.Reactions>
  </Bubble.Root>
</Bubble.Group>`,

  attachment: `
<Attachment.Root>
  <Attachment.Media variant="image">
    <img src="/workspace.png" alt="Workspace" />
  </Attachment.Media>
  <Attachment.Content>
    <Attachment.Title>workspace.png</Attachment.Title>
    <Attachment.Description>PNG · 820 KB</Attachment.Description>
  </Attachment.Content>
  <Attachment.Actions>
    <Attachment.Action aria-label="Remove workspace.png">×</Attachment.Action>
  </Attachment.Actions>
</Attachment.Root>`,

  marker: `
<Marker.Root>
  <Marker.Content>Switched to a new branch</Marker.Content>
</Marker.Root>
<Marker.Root variant="separator">
  <Marker.Content>Conversation compacted</Marker.Content>
</Marker.Root>`,

  "message-scroller": `
<MessageScroller.Provider>
  <MessageScroller.Root>
    <MessageScroller.Viewport>
      <MessageScroller.Content>
        {#each turns as turn (turn.id)}
          <MessageScroller.Item messageId={turn.id} scrollAnchor={turn.role === "user"}>
            {turn.text}
          </MessageScroller.Item>
        {/each}
      </MessageScroller.Content>
    </MessageScroller.Viewport>
    <MessageScroller.Button />
  </MessageScroller.Root>
</MessageScroller.Provider>`,

  trace: `
<Trace.Root>
  <Trace.Collapsible>
    <Trace.CollapsibleTrigger>
      <Trace.Line>
        <Trace.Title>Ran pnpm --version</Trace.Title>
      </Trace.Line>
    </Trace.CollapsibleTrigger>
    <Trace.CollapsibleContent>12.10.1</Trace.CollapsibleContent>
  </Trace.Collapsible>
  <Trace.Line status="running">
    <Trace.Title>Writing the fix</Trace.Title>
    <Trace.Description>2 sources</Trace.Description>
  </Trace.Line>
</Trace.Root>`,

  suggestion: `
<Suggestions>
  {#each ideas as idea (idea)}
    <Suggestion suggestion={idea} onclick={(text) => (value = text)} />
  {/each}
</Suggestions>`,

  "ai-prompt": `
<PromptInput onSubmit={(text) => send(text)}>
  <PromptInputBody>
    <PromptInputTextarea bind:value placeholder="Ask anything..." />
    <PromptInputToolbar>
      <PromptInputSubmit {status} />
    </PromptInputToolbar>
  </PromptInputBody>
</PromptInput>`,

  "ai-button": `
<AiButton {status} label="Draft reply" processingLabel="Drafting..." onclick={draft} />
<AiButton iconOnly {status} onclick={draft} />`,

  reasoning: `
<Reasoning duration={4}>
  <ReasoningTrigger />
  <ReasoningContent>The model's reasoning, as text.</ReasoningContent>
</Reasoning>`,

  confirmation: `
<Confirmation {kind}>
  <ConfirmationTitle>Delete 3 stale views?</ConfirmationTitle>
  <ConfirmationState when="requested">
    <ConfirmationActions>
      <ConfirmationAction variant="outline" onclick={() => (kind = "rejected")}>Cancel</ConfirmationAction>
      <ConfirmationAction onclick={() => (kind = "accepted")}>Delete</ConfirmationAction>
    </ConfirmationActions>
  </ConfirmationState>
  <ConfirmationState when="accepted">Deleted 3 views.</ConfirmationState>
  <ConfirmationState when="rejected">Kept the views.</ConfirmationState>
</Confirmation>`,

  "generation-progress": `
<GenerationProgress
  status="generating"
  label="Writing the proposal"
  progress={{ completed: 2, total: 5, currentStep: "Writing the intro" }}
  showElapsed
/>`,

  "agent-avatar": `
<AgentAvatar name="Ada" role="Researcher" shape="clover" color="#41C4FF" state="working" />`,

  "agent-cast": `
<AgentCast
  agents={[{ id: "ada", name: "Ada", role: "Researcher", shape: "clover", group: "Research" }]}
  selectedId={selected}
  onSelect={(agent) => (selected = agent.id ?? agent.name)}
/>`,

  "status-badge": `
<StatusBadge {statuses} status="proposal" />
<StatusBadge tone="success" dot>Connected</StatusBadge>`,

  "status-icon": `
{#each statuses.ids as id (id)}
  <StatusIcon {statuses} status={id} />
  <span>{statuses.label(id)}</span>
{/each}`,

  "work-parts": `
<GroupHead label="In progress" hue="var(--color-info)" count={1} onAdd={addTask} />
<WorkWell hue="var(--color-info)">
  <WorkCard>
    Send the signed SOW to the client
    {#snippet meta()}<span>Oct 28</span>{/snippet}
  </WorkCard>
</WorkWell>
<PropertyRow label="Assignee">Ada</PropertyRow>`,

  "kanban-board": `
<KanbanBoard
  {columns}
  items={tasks}
  getId={(task) => task.id}
  getColumn={(task) => task.columnId}
  boardOrder={(task) => task.boardOrder}
  {onMove}
>
  {#snippet renderCard(task)}
    <article>{task.title}</article>
  {/snippet}
</KanbanBoard>`,

  "task-list": `
<TaskList
  {groups}
  items={tasks}
  getId={(task) => task.id}
  getGroup={(task) => task.status}
  boardOrder={(task) => task.boardOrder}
  {onMove}
>
  {#snippet renderRow(task)}
    <span>{task.title}</span>
  {/snippet}
</TaskList>`,

  "task-gantt": `
<TaskGantt
  items={tasks}
  getId={(task) => task.id}
  getTitle={(task) => task.title}
  getStart={(task) => task.start}
  getEnd={(task) => task.end}
  today={todayIso()}
  {onDatesChange}
/>`,

  "side-panel": `
<SidePanel
  bind:open
  title="Write the pricing page"
  description="Ada, due Friday"
  badges={[{ label: "In review", tone: "warning" }]}
>
  <p>The record's fields go here.</p>
</SidePanel>`,

  thread: `
<Thread
  {comments}
  {onPost}
  {onEdit}
  {onDelete}
  {onResolve}
  canEdit={(comment) => comment.author.kind === "user"}
/>`,

  "threaded-inbox": `
<ThreadInbox
  {entries}
  bind:selected
  unreadFirst
  onRead={(thread, read) => markThread(thread.key, read)}
/>`,

  "triage-queue": `
<TriageQueue {items} key={(mail) => mail.id} empty="Nothing waiting for you.">
  {#snippet row(mail)}
    <TriagePlan
      sender={mail.from}
      subject={mail.subject}
      plan={mail.plan}
      onApprove={() => approve(mail.id)}
      onPick={() => pick(mail.id)}
      onDismiss={() => dismiss(mail.id)}
    />
  {/snippet}
</TriageQueue>`,

  "inline-editor": `
<InlineEditor
  {doc}
  placeholder="Write a note"
  onDocChange={(next) => (doc = next)}
  onExit={() => api?.focus()}
  onReady={(editor) => (api = editor)}
/>`,

  "rich-editor": `
<RichEditor content={doc} onContentChange={(json) => (doc = json)} minHeight="14rem" />`,

  "section-card": `
<SectionCard title="General">
  {#snippet actions()}
    <button type="button">Reset</button>
  {/snippet}
  <p>The section's rows go here.</p>
</SectionCard>`,

  "doc-page": `
<DocPage
  title="Learnings"
  summary="What engagements taught"
  headings={[{ id: "what-worked", label: "What worked" }]}
  contentsLabel="On this page"
>
  <h2 id="what-worked">What worked</h2>
  <p>Splitting the call in two.</p>
</DocPage>`,

  "list-page": `
<ListPageShell>
  {#snippet content()}
    <MasterDetail>
      {#snippet rail()}
        <RailBody>
          {#each quotes as quote (quote.id)}
            <RailRow title={quote.client} onclick={() => (selectedId = quote.id)} />
          {/each}
        </RailBody>
      {/snippet}
      {#snippet detail()}
        <DetailHeader title={selected.client} />
      {/snippet}
    </MasterDetail>
  {/snippet}
</ListPageShell>`,

  dashboard: `
<DashboardSection title="Sales">
  <StatBand columns={2}>
    <StatTile label="Revenue" value="$48,200" deltaPct={12.4} direction="up-good" lead />
    <StatTile label="Orders" value="1,284" deltaPct={-3.1} direction="up-good" />
  </StatBand>
  <PanelGrid columns={2}>
    <section aria-label="Top products">
      <DataTable rows={top} {columns} rowKey={(row) => row.id} leadLabel="Product" emptyLabel="No sales">
        {#snippet lead(row)}{row.name}{/snippet}
      </DataTable>
    </section>
  </PanelGrid>
</DashboardSection>`,

  "slide-deck": `
<Deck bind:index bind:step theme="ink" title="Quarterly review">
  <Slide align="start" notes="Open on the headline number.">
    <h1 class="deck-title">Numbers are up and to the right</h1>
  </Slide>
  <Slide align="start">
    <ul>
      <Fragment as="li" step={1}>Launched the new pricing page</Fragment>
      <Fragment as="li" step={2}>Cut load time in half</Fragment>
    </ul>
  </Slide>
</Deck>`,

  "hold-to-confirm": `
<HoldToConfirm onConfirm={() => (deleted = true)}>
  {#snippet idle()}Hold to delete{/snippet}
  {#snippet holding()}Keep holding{/snippet}
</HoldToConfirm>`,
};

export const usageSnippets: Record<string, string> = Object.fromEntries(
  Object.entries(written).map(([slug, markup]) => [slug, markup.trim()]),
);

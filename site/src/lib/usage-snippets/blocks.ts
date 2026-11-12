/** Usage snippets for the Blocks pages, by slug. */
export const blocks: Record<string, string> = {
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
};

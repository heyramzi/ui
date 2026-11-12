/** Usage snippets for Data display and Layout pages, by slug. */
export const display: Record<string, string> = {
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

  item: `
<Item.Root variant="outline">
  <Item.Content>
    <Item.Title>Two-factor sign-in</Item.Title>
    <Item.Description>A code from your phone at each new sign-in.</Item.Description>
  </Item.Content>
</Item.Root>`,
};

/** Usage snippets for Actions and Feedback pages, by slug. */
export const actions: Record<string, string> = {
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

  "hold-to-confirm": `
<HoldToConfirm onConfirm={() => (deleted = true)}>
  {#snippet idle()}Hold to delete{/snippet}
  {#snippet holding()}Keep holding{/snippet}
</HoldToConfirm>`,
};

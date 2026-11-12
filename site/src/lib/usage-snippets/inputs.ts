/** Usage snippets for Inputs pages, by slug. */
export const inputs: Record<string, string> = {
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
};

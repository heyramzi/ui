<script lang="ts">
  import * as Accordion from "@heyramzi/ui/shadcn/accordion";
</script>

<Accordion.Root type="single" class="w-full max-w-md" value="item-1">
  <Accordion.Item value="item-1">
    <Accordion.Trigger>How do I install a component?</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <p>Copy the source file into your project. The tokens come with it, so it looks right on day one.</p>
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-2">
    <Accordion.Trigger>Which packages are published?</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <p>Four packages ship to the registry: ui, board, agents and slides. Install only what you need.</p>
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-3">
    <Accordion.Trigger>Do the charts need a server?</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <p>No. Every chart renders from the data you pass in, with no fetch and no server action.</p>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>

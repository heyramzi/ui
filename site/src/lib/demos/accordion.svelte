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
      <p>Two packages ship to npm: ui, with the agents inside it, and marketing. Install only what you need.</p>
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="item-3">
    <Accordion.Trigger>Do the charts need a server?</Accordion.Trigger>
    <Accordion.Content class="flex flex-col gap-4 text-balance">
      <p>No. Every chart renders from the data you pass in, with no fetch and no server action.</p>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>

<Accordion.Root type="single" class="mt-8 w-full max-w-md">
  <Accordion.Item value="plus">
    <Accordion.Trigger>
      A plus that turns into a minus
      {#snippet indicator()}
        <span class="relative mt-1 inline-block size-4 shrink-0" aria-hidden="true">
          <i class="absolute top-[7px] left-0 h-0.5 w-4 rounded-[1px] bg-current"></i>
          <i
            class="absolute top-0 left-[7px] h-4 w-0.5 rounded-[1px] bg-current transition-transform duration-200 group-aria-expanded/accordion-trigger:scale-y-0"
          ></i>
        </span>
      {/snippet}
    </Accordion.Trigger>
    <Accordion.Content>
      <p>Pass an indicator snippet in place of the caret and style it off the trigger's expanded state.</p>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>

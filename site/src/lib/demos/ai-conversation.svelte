<script lang="ts">
  import { Conversation, ConversationContent, Response } from "@heyramzi/ui/ai";
  import * as Message from "@heyramzi/ui/shadcn/message";
  import * as Bubble from "@heyramzi/ui/shadcn/bubble";

  const answer = `Here is the plan:

1. **Extract** the beam into the shared package
2. **Showcase** it on the Effects page
3. **Migrate** both apps onto the shared copy

Want me to start?`;
</script>

<div class="h-68 w-full max-w-md">
  <Conversation>
    <ConversationContent class="space-y-4 p-1">
      <Message.Root align="end">
        <Message.Content>
          <Bubble.Root variant="default" align="end">
            <Bubble.Content>How should I clean up our beam effects?</Bubble.Content>
          </Bubble.Root>
        </Message.Content>
      </Message.Root>
      <Message.Root align="start">
        <Message.Content>
          <Bubble.Root variant="muted" align="start">
            <Bubble.Content><Response content={answer} /></Bubble.Content>
          </Bubble.Root>
        </Message.Content>
      </Message.Root>
    </ConversationContent>
  </Conversation>
</div>

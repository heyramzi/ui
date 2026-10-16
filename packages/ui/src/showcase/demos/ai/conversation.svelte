<script lang="ts">
	import { Conversation, ConversationContent, Response } from "#src/ai/index.js";
	import * as Message from "#src/shadcn/message/index.js";
	import * as Bubble from "#src/shadcn/bubble/index.js";
	import { Button } from "#src/shadcn/button/index.js";
	import Copy from "@lucide/svelte/icons/copy";
	import RefreshCw from "@lucide/svelte/icons/refresh-cw";
	import ThumbsUp from "@lucide/svelte/icons/thumbs-up";

	const answer = `Here's the plan:

1. **Extract** \`AnimatedBeam\` into \`@heyramzi/ui\`
2. **Showcase** it on the Effects page
3. **Migrate** both apps onto the shared copy

Want me to start?`;
</script>

<div class="convo">
	<Conversation>
		<ConversationContent class="space-y-4 p-1">
			<Message.Root align="end">
				<Message.Content>
					<Bubble.Root variant="default" align="end">
						<Bubble.Content>How should I DRY up our beam effects?</Bubble.Content>
					</Bubble.Root>
				</Message.Content>
			</Message.Root>
			<Message.Root align="start">
				<Message.Content>
					<Bubble.Root variant="muted" align="start">
						<Bubble.Content><Response content={answer} /></Bubble.Content>
					</Bubble.Root>
					<Message.Footer>
						<Button variant="ghost" size="sm" icon class="size-7" title="Copy">
							<Copy class="size-3.5" />
							<span class="sr-only">Copy</span>
						</Button>
						<Button variant="ghost" size="sm" icon class="size-7" title="Regenerate">
							<RefreshCw class="size-3.5" />
							<span class="sr-only">Regenerate</span>
						</Button>
						<Button variant="ghost" size="sm" icon class="size-7" title="Good answer">
							<ThumbsUp class="size-3.5" />
							<span class="sr-only">Good answer</span>
						</Button>
					</Message.Footer>
				</Message.Content>
			</Message.Root>
		</ConversationContent>
	</Conversation>
</div>

<style>
	.convo {
		height: 17rem;
		width: 100%;
	}
</style>

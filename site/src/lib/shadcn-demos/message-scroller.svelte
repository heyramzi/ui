<!-- Ours, not upstream's: theirs streams through @ai-sdk/svelte and docs-only helpers this package doesn't ship. -->
<script lang="ts">
	import * as Bubble from "@heyramzi/ui/shadcn/bubble";
	import * as Message from "@heyramzi/ui/shadcn/message";
	import * as MessageScroller from "@heyramzi/ui/shadcn/message-scroller";
	import { Response } from "@heyramzi/ui/ai";

	const turns = [
		{ id: "q1", role: "user", text: "How should I clean up our beam effects?" },
		{
			id: "a1",
			role: "assistant",
			text: "Here is the plan:\n\n1. **Extract** the beam into the shared package\n2. **Showcase** it on the Effects page\n3. **Migrate** both apps onto the shared copy",
		},
		{ id: "q2", role: "user", text: "And the old copies?" },
		{ id: "a2", role: "assistant", text: "Delete them in the same change, so nothing imports the stale one." },
	] as const;
</script>

<div class="h-68 w-full max-w-md">
	<MessageScroller.Provider>
		<MessageScroller.Root>
			<MessageScroller.Viewport>
				<MessageScroller.Content class="gap-4 p-1">
					{#each turns as turn (turn.id)}
						{@const user = turn.role === "user"}
						<MessageScroller.Item messageId={turn.id} scrollAnchor={user}>
							<Message.Root align={user ? "end" : "start"}>
								<Message.Content>
									<Bubble.Root variant={user ? "default" : "muted"} align={user ? "end" : "start"}>
										<Bubble.Content>
											{#if user}{turn.text}{:else}<Response content={turn.text} />{/if}
										</Bubble.Content>
									</Bubble.Root>
								</Message.Content>
							</Message.Root>
						</MessageScroller.Item>
					{/each}
				</MessageScroller.Content>
			</MessageScroller.Viewport>
			<MessageScroller.Button />
		</MessageScroller.Root>
	</MessageScroller.Provider>
</div>

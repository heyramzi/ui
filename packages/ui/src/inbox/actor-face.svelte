<script lang="ts">
	import type { Snippet } from "svelte";
	import { AgentAvatar } from "#src/agents/index.js";
	import { initial } from "#src/lib/initials.js";
	import type { InboxActor } from "#src/inbox/types.js";

	interface Props {
		actor: InboxActor;
		avatar?: Snippet<[InboxActor]>;
	}

	let { actor, avatar }: Props = $props();
</script>

<span class="relative size-6 shrink-0">
	{#if avatar}
		{@render avatar(actor)}
	{:else if actor.kind === "agent"}
		<AgentAvatar name={actor.name} size={24} paused interactive={false} />
	{:else if actor.avatar}
		<img src={actor.avatar} alt="" class="size-6 rounded-full object-cover" />
	{:else}
		<span
			class="grid size-6 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
			aria-hidden="true"
		>
			{initial(actor.name)}
		</span>
	{/if}
</span>

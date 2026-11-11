<script lang="ts">
	import { ChatGptWindow, type ChatMessage } from "@heyramzi/ui/ai/chat-window";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Timer } from "phosphor-svelte";

	let run = $state(0);

	const messages: ChatMessage[] = [
		{ role: "user", text: "How many hours did we log on the Harbor site last week?" },
		{ role: "tool", name: "Tally", label: "Read week 45 timesheets", icon: tally },
		{ role: "assistant", content: answer },
	];
</script>

{#snippet tally()}
	<span class="grid size-5 place-items-center rounded-md bg-teal-700 text-white">
		<Timer size={13} weight="bold" />
	</span>
{/snippet}

{#snippet answer()}
	<p>Your team logged <strong>86 hours</strong> on Harbor in week 45, 12 more than week 44.</p>
	<table>
		<thead><tr><th>Person</th><th>Hours</th></tr></thead>
		<tbody>
			<tr><td>Ines</td><td>34</td></tr>
			<tr><td>Marco</td><td>29</td></tr>
			<tr><td>Yuki</td><td>23</td></tr>
		</tbody>
	</table>
	<p>Most of the rise is Ines's Thursday on the roof survey.</p>
{/snippet}

<div class="flex w-full max-w-3xl flex-col items-end gap-3">
	<div class="h-[34rem] w-full">
		{#key run}
			<ChatGptWindow title="Harbor hours" model="ChatGPT 5.5" {messages} reveal />
		{/key}
	</div>
	<Button variant="outline" size="sm" onclick={() => run++}>Replay</Button>
</div>

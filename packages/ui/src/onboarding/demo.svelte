<script lang="ts">
	import { Button } from "#src/shadcn/button/index.js";
	import { Badge } from "#src/shadcn/badge/index.js";
	import { Plus } from "phosphor-svelte";
	import OnboardingProvider from "#src/onboarding/onboarding-provider.svelte";
	import { defineTours } from "#src/onboarding/define-tours.js";
	import { memoryStore } from "#src/onboarding/stores.js";
	import type { Strings } from "#src/onboarding/types.js";

	const tours = defineTours([
		{
			id: "demo:intro",
			route: "/demo/intro",
			kind: "intro",
			title: "The week in one place",
			body: "Open work sits on the left. Anything late floats to the top.",
		},
		{
			id: "demo:board",
			route: "/demo/board",
			kind: "steps",
			steps: [
				{ target: '[data-tour="demo-new"]', title: "Start here", body: "A new project takes a name and a client. That's all.", placement: "bottom-end" },
				{ target: '[data-tour="demo-filter"]', title: "Narrow it down", body: "Late shows what slipped. Mine shows what's yours.", placement: "bottom-start" },
				{ target: '[data-tour="demo-list"]', title: "Open a row", body: "Click a project to see its tasks, files and notes.", placement: "top" },
			],
		},
	]);

	const strings: Strings = {
		next: "Next",
		back: "Back",
		done: "Got it",
		skip: "Skip the tour",
		progress: (n, total) => `Step ${n} of ${total}`,
	};

	const rows = [
		{ name: "Brand refresh", client: "Northwind", tone: "success" as const, label: "On track" },
		{ name: "Pricing page", client: "Acme", tone: "warning" as const, label: "Late" },
		{ name: "Launch email", client: "Globex", tone: "neutral" as const, label: "Draft" },
	];

	let routeId = $state<string | null>(null);
	let run = $state(0);
	let store = $state(memoryStore());

	// A fresh store each time, so the button always has an unseen tour to show.
	function start(route: string) {
		store = memoryStore();
		routeId = route;
		run += 1;
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		<Button variant="outline" size="sm" onclick={() => start("/demo/board")}>Show the page tour</Button>
		<Button variant="outline" size="sm" onclick={() => start("/demo/intro")}>Show the intro card</Button>
	</div>

	<div class="bg-card ring-foreground/10 flex flex-col gap-4 rounded-xl p-4 ring-1">
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-sm font-semibold">Projects</h2>
			<Button size="sm" data-tour="demo-new"><Plus weight="bold" />New project</Button>
		</div>
		<div class="flex gap-1.5" data-tour="demo-filter">
			<Badge variant="outline">All</Badge>
			<Badge variant="outline">Late</Badge>
			<Badge variant="outline">Mine</Badge>
		</div>
		<ul class="divide-border border-border divide-y rounded-lg border" data-tour="demo-list">
			{#each rows as row (row.name)}
				<li class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
					<span class="min-w-0 truncate font-medium">{row.name}</span>
					<span class="text-muted-foreground hidden sm:block">{row.client}</span>
					<Badge variant="outline">{row.label}</Badge>
				</li>
			{/each}
		</ul>
	</div>
</div>

{#key run}
	<OnboardingProvider {tours} {store} {strings} {routeId} replayKey={false} />
{/key}

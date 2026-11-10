<script lang="ts">
	// A working slice of a product screen, built only from kit parts, so the first thing on the
	// page is the kit doing its job. Static imports on purpose: these parts are small, and the
	// hero can't wait on a lazy chunk.
	import { HoldToConfirm } from "@heyramzi/ui/components/hold-to-confirm";
	import { StatusBadge } from "@heyramzi/ui/status";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { Switch } from "@heyramzi/ui/shadcn/switch";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "@heyramzi/ui/shadcn/tabs";

	const lines = [
		{ id: "workshop", label: "Brand workshop, 2 days", amount: 3200 },
		{ id: "build", label: "Landing page build", amount: 4800 },
		{ id: "hosting", label: "Hosting, 12 months", amount: 360 },
	];
	const total = lines.reduce((sum, line) => sum + line.amount, 0);
	const money = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	});

	let tab = $state("lines");
	let remind = $state(true);
	let status = $state<"overdue" | "reminded" | "void">("overdue");

	const activity = $derived([
		...(status === "reminded" ? [{ id: "nudge", when: "Just now", what: "Reminder sent" }] : []),
		...(status === "void" ? [{ id: "void", when: "Just now", what: "Voided" }] : []),
		{ id: "open", when: "30 Oct", what: "Opened by Claire Morel" },
		{ id: "sent", when: "14 Oct", what: "Sent to accounts@ateliermorel.fr" },
	]);
</script>

<div class="overflow-hidden rounded-(--radius-2xl) bg-card shadow-(--elev-raised)">
	<div class="flex items-start justify-between gap-4 px-5 pt-5">
		<div class="min-w-0">
			<p class="truncate text-base font-semibold tracking-tight">Atelier Morel</p>
			<p class="mt-0.5 text-sm text-muted-foreground">Invoice 2041, due 28 Oct</p>
		</div>
		{#if status === "void"}
			<StatusBadge tone="neutral" dot>Void</StatusBadge>
		{:else if status === "reminded"}
			<StatusBadge tone="info" dot>Reminded</StatusBadge>
		{:else}
			<StatusBadge tone="warning" dot>Overdue</StatusBadge>
		{/if}
	</div>

	<Tabs bind:value={tab} class="mt-4 gap-0">
		<div class="px-5">
			<TabsList>
				<TabsTrigger value="lines">Lines</TabsTrigger>
				<TabsTrigger value="activity">Activity</TabsTrigger>
			</TabsList>
		</div>
		<!-- One height for both tabs, so the card's footer doesn't jump on a switch. -->
		<div class="min-h-44 px-5 pb-4 pt-3">
			<TabsContent value="lines">
				<ul class="text-sm">
					{#each lines as line (line.id)}
						<li class="flex justify-between gap-4 border-b border-border py-2">
							<span class="truncate text-muted-foreground">{line.label}</span>
							<span class="tabular-nums">{money.format(line.amount)}</span>
						</li>
					{/each}
				</ul>
				<p class="flex justify-between pt-3 text-sm font-semibold">
					<span>Total</span><span class="tabular-nums">{money.format(total)}</span>
				</p>
			</TabsContent>
			<TabsContent value="activity">
				<ol class="flex flex-col gap-2.5 text-sm">
					{#each activity as item (item.id)}
						<li class="flex gap-4">
							<span class="w-16 shrink-0 tabular-nums text-muted-foreground">{item.when}</span>
							<span class="min-w-0 truncate">{item.what}</span>
						</li>
					{/each}
				</ol>
			</TabsContent>
		</div>
	</Tabs>

	<label class="flex items-center justify-between gap-4 border-t border-border px-5 py-3 text-sm">
		<span>Remind every 7 days</span>
		<Switch bind:checked={remind} disabled={status === "void"} />
	</label>

	<div class="flex flex-wrap items-center justify-end gap-2 bg-muted/50 px-5 py-3">
		<HoldToConfirm
			size="sm"
			disabled={status === "void"}
			onConfirm={() => {
				status = "void";
				remind = false;
			}}
		>
			{#snippet idle()}Hold to void{/snippet}
			{#snippet holding()}Keep holding{/snippet}
		</HoldToConfirm>
		<Button
			size="sm"
			disabled={status !== "overdue"}
			onclick={() => {
				status = "reminded";
				tab = "activity";
			}}>Send reminder</Button
		>
	</div>
</div>

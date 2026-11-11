<script lang="ts">
	import { Flag } from "@heyramzi/ui/components/flag";

	const names = new Intl.DisplayNames(["en"], { type: "region" });
	const countries = ["JP", "PL", "FR", "DE", "BR", "IN", "KE", "CA", "MX", "NZ"];
</script>

<div class="flex w-full max-w-sm flex-col gap-6">
	<p class="text-sm text-foreground">
		Shipping from <span class="whitespace-nowrap"><Flag code="pt" /> Portugal</span> to
		<span class="whitespace-nowrap"><Flag code="jp" /> Japan</span>,
		<span class="whitespace-nowrap"><Flag code="pl" /> Poland</span> and
		<span class="whitespace-nowrap"><Flag code="us" /> the United States</span>.
	</p>

	<ul class="flex flex-col text-sm">
		{#each countries as code (code)}
			<li class="flex items-center gap-2.5 border-b border-border py-2 last:border-b-0">
				<Flag {code} />
				<span class="text-foreground">{names.of(code)}</span>
				<span class="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{code}</span>
			</li>
		{/each}
		<!-- An unknown code renders nothing; the span keeps the flag's box so the row doesn't shift. -->
		<li class="flex items-center gap-2.5 py-2">
			<span class="inline-block aspect-[3/2] h-[1em] shrink-0"><Flag code="zz" /></span>
			<span class="text-muted-foreground">Unknown region</span>
			<span class="ml-auto font-mono text-xs text-muted-foreground">ZZ</span>
		</li>
	</ul>

	<div class="flex items-center gap-4">
		<Flag code="jp" label="Japan" class="h-8" />
		<Flag code="pl" label="Poland" class="h-8" />
		<Flag code="np" label="Nepal" class="h-8" />
	</div>
</div>

<script lang="ts">
	import { GenerationProgress } from "@heyramzi/ui/ai/generation-progress";
	import { Button } from "@heyramzi/ui/shadcn/button";

	const steps = [
		"Reading the brief",
		"Outlining three sections",
		"Writing the intro",
		"Checking the figures",
		"Formatting the page",
	];

	let completed = $state(2);
	let failed = $state(false);

	$effect(() => {
		if (failed) return;
		const timer = setInterval(() => (completed = (completed % steps.length) + 1), 1800);
		return () => clearInterval(timer);
	});
</script>

<div class="flex w-full max-w-sm flex-col gap-4">
	<GenerationProgress
		status={failed ? "failed" : "generating"}
		label="Writing the proposal"
		progress={{ completed, total: steps.length, currentStep: steps[completed - 1] }}
		showElapsed
	/>
	<GenerationProgress status="generating" label="Waiting for the model" />
	<Button variant="outline" size="sm" class="self-start" onclick={() => (failed = !failed)}>
		{failed ? "Retry" : "Fail it"}
	</Button>
</div>

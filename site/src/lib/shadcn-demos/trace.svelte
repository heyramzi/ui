<!-- Ours, not upstream's: theirs streams through @ai-sdk/svelte and docs-only helpers this package doesn't ship. -->
<script lang="ts">
	import { CheckCircle, CircleNotch, WarningCircle } from "phosphor-svelte";
	import * as CodeBlock from "@heyramzi/ui/shadcn/code-block";
	import * as Trace from "@heyramzi/ui/shadcn/trace";

	const steps = [
		{ command: "pnpm --version", output: "12.10.1" },
		{
			command: "git diff --stat HEAD~1 -- package.json pnpm-lock.yaml",
			output: " package.json | 2 +-\n 1 file changed, 1 insertion(+), 1 deletion(-)",
		},
		{
			command: "pnpm install --frozen-lockfile",
			error: "ERR_PNPM_OUTDATED_LOCKFILE  pnpm-lock.yaml is not up to date with package.json",
		},
	];
</script>

<div class="w-full max-w-md">
	<Trace.Root>
		<Trace.Line>
			<Trace.Icon><CheckCircle /></Trace.Icon>
			<Trace.Title>Thought for 5s</Trace.Title>
		</Trace.Line>
		{#each steps as step (step.command)}
			<Trace.Collapsible>
				<Trace.CollapsibleTrigger>
					<Trace.Line status={step.error ? "error" : undefined}>
						<Trace.Icon>
							{#if step.error}<WarningCircle />{:else}<CheckCircle />{/if}
						</Trace.Icon>
						<Trace.Title>{step.error ? "Failed to run" : "Ran"} {step.command}</Trace.Title>
					</Trace.Line>
				</Trace.CollapsibleTrigger>
				<Trace.CollapsibleContent>
					<CodeBlock.Root size="sm" variant={step.error ? "destructive" : "default"}>
						<CodeBlock.Content wrap class="max-h-64" code={step.error ?? step.output} />
					</CodeBlock.Root>
				</Trace.CollapsibleContent>
			</Trace.Collapsible>
		{/each}
		<Trace.Line status="running">
			<Trace.Icon><CircleNotch class="animate-spin" /></Trace.Icon>
			<Trace.Title>Writing the fix</Trace.Title>
			<Trace.Description>2 sources</Trace.Description>
		</Trace.Line>
	</Trace.Root>
</div>

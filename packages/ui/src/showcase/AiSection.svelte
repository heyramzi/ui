<!-- ========================== -->
<!-- IMPORTS                    -->
<!-- ========================== -->
<script lang="ts">
	import ShowcaseStage from "#src/showcase/ShowcaseStage.svelte";
	import Prompt from "#src/showcase/demos/ai/prompt-input.svelte";
	import LoadingStateDemo from "#src/showcase/demos/ai/loading-state.svelte";
	import ThinkingDotsDemo from "#src/showcase/demos/ai/thinking-dots.svelte";
	import Reasoning from "#src/showcase/demos/ai/reasoning.svelte";
	import Confirm from "#src/showcase/demos/ai/confirmation.svelte";
	import VoiceWaveformDemo from "#src/showcase/demos/ai/voice-waveform.svelte";
	import type { Component } from "svelte";

	// =========================
	// TYPES
	// =========================
	type Demo = { title: string; note: string; Comp: Component; path: string };

	// =========================
	// STATE
	// =========================
	// The order is the order a turn happens in: the surface it is said on, the waiting, the thinking, the decision, and last the voice.
	const demos: Demo[] = [
		{
			title: "PromptInput",
			note: "Suggestions, textarea, status-aware submit.",
			Comp: Prompt,
			path: "import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputToolbar, PromptInputSubmit, Suggestions, Suggestion } from '@heyramzi/ui/ai';",
		},
		{
			title: "PixelLoader",
			note: "Pixel-grid loader with shimmer and elapsed time.",
			Comp: LoadingStateDemo,
			path: "import { PixelLoader } from '@heyramzi/ui/ai';",
		},
		{
			title: "ThinkingDots",
			note: "The quiet wait, with a label.",
			Comp: ThinkingDotsDemo,
			path: "import { ThinkingDots } from '@heyramzi/ui/ai';",
		},
		{
			title: "Reasoning",
			note: "Auto-opens while streaming, shows think time.",
			Comp: Reasoning,
			path: "import { Reasoning, ReasoningTrigger, ReasoningContent } from '@heyramzi/ui/ai';",
		},
		{
			title: "Confirmation",
			note: "Tool-call approval with resolved states.",
			Comp: Confirm,
			path: "import { Confirmation, ConfirmationTitle, ConfirmationRequest, ConfirmationAccepted, ConfirmationRejected, ConfirmationActions, ConfirmationAction } from '@heyramzi/ui/ai';",
		},
		{
			title: "VoiceWaveform",
			note: "Tap to toggle the active state.",
			Comp: VoiceWaveformDemo,
			path: "import { VoiceWaveform } from '@heyramzi/ui/ai';",
		},
	];
</script>

<!-- ========================== -->
<!-- MARKUP                     -->
<!-- ========================== -->
<div class="ai-stack">
	{#each demos as d (d.title)}
		<ShowcaseStage title={d.title} note={d.note} importPath={d.path} wide>
			<div class="ai-demo"><d.Comp /></div>
		</ShowcaseStage>
	{/each}
</div>

<!-- ========================== -->
<!-- STYLE                      -->
<!-- ========================== -->
<style>
	/*
	 * One item per row, which is how beautifului.dev lays its AI set out and what this section is judged against. The two-column grid it replaces made every
	 */

	/*
	 * band as tall as its taller half, so a one-line chip row sat in 21rem of
	 */

	/*
	 * nothing next to a conversation, and the eye had two places to be on every scroll step. A single column also lets each demo keep the width it was
	 */

	/*
	 * designed for instead of a track that changes with the viewport.
	 */
	.ai-stack {
		display: flex;
		flex-direction: column;
	}

	/* The dashed rule is the separator, not a card edge: these are entries in one
	   list, and a solid border would read as a stack of boxes. */
	.ai-stack > :global(.sc-stage) {
		padding-block: 2rem;
		border-bottom: 1px dashed
			color-mix(in oklab, var(--color-border, var(--border)) 80%, transparent);
	}

	.ai-stack > :global(.sc-stage:last-child) {
		border-bottom: 0;
	}

	/*
	 * Title and note on one baseline, the way a numbered list entry reads. The stage stacks them by default because a 310px grid column cannot hold both;
	 */

	/*
	 * at full width it can, and the stacked form leaves the note orphaned under a hanging indent.
	 */
	@media (min-width: 40rem) {
		.ai-stack > :global(.sc-stage) :global(.sc-stage-name) {
			flex-direction: row;
			align-items: baseline;
			gap: 0.625rem;
		}

		.ai-stack > :global(.sc-stage) :global(.sc-stage-name p) {
			padding-inline-start: 0;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
	}

	/*
	 * 17rem is beautifului.dev's 272px demo surface. Every ground on the page is the same height, so the list scrolls at one rhythm however tall the demo
	 */

	/*
	 * inside it happens to be.
	 */
	.ai-stack > :global(.sc-stage) > :global(.sc-ground) {
		min-height: 17rem;
	}

	/* The demo is centred inside the full-width ground rather than stretched
	   across it: a prompt bar at 1400px is not a prompt bar, it is a banner. */
	.ai-demo {
		width: 100%;
		max-width: 30rem;
		margin-inline: auto;
	}
</style>

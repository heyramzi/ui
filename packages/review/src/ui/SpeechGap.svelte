<script lang="ts">
	import { clock, plural } from "#src/core/format.js";
	import type { SpeechGap } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import Kbd from "#src/ui/Kbd.svelte";

	let { gap }: { gap: SpeechGap } = $props();
	const app = useApp();

	let text = $state("");
	/** The words went out and the server hasn't rebuilt the transcript yet. */
	let sent = $state(false);
	const length = $derived(Math.round((gap.end - gap.start) * 10) / 10);
	const words = $derived(text.trim().split(/\s+/).filter(Boolean).length);

	function submit() {
		if (!text.trim() || sent) return;
		sent = true;
		app.review.act({
			type: "speech",
			source: gap.source,
			start: gap.start,
			end: gap.end,
			text: text.trim(),
		});
	}
	function onkey(event: KeyboardEvent) {
		if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && !event.isComposing) {
			event.preventDefault();
			submit();
		}
	}
	// WHY: a refused send leaves the gap on the page, so the form opens again with what was typed.
	$effect(() => {
		if (app.review.save === "error") sent = false;
	});
</script>

<div class="gap" data-speech-gap data-start={gap.start} data-seconds={gap.seconds}>
	<div class="head">
		<Icon name="alert" small />
		<strong>Speech, no words</strong>
		<span class="range num"
			>{clock(gap.start)} to {clock(gap.end)}, {length}s{gap.cut ? ", in a cut stretch" : ""}</span
		>
	</div>
	<textarea
		bind:value={text}
		rows="2"
		aria-label="Type what you said between {clock(gap.start)} and {clock(gap.end)}"
		placeholder="What you said"
		disabled={sent}
		onkeydown={onkey}></textarea>
	<div class="foot">
		<span class="count num"
			>{#if sent}Spreading the words over the speech{:else if words}{plural(
					words,
					"word",
				)}{/if}</span
		>
		<button class="btn primary" disabled={!text.trim() || sent} onclick={submit}
			>Add the words<Kbd combo="mod+enter" /></button
		>
	</div>
</div>

<style>
	.gap {
		display: grid;
		gap: 8px;
		margin: 6px 0;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--warn);
		background: var(--warn-soft);
	}
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px 8px;
		color: var(--warn-text);
		font-size: var(--fs-sm);
	}
	.head strong {
		color: var(--text);
		font-weight: 600;
	}
	.range {
		color: var(--dim);
		font: 500 var(--fs-xs) / 1.4 var(--mono);
	}
	textarea {
		width: 100%;
		min-height: 44px;
		padding: 8px 10px;
		resize: vertical;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--ground);
		font-size: var(--fs-md);
		line-height: 1.5;
		transition: border-color var(--duration-quick) var(--ease-smooth-out);
	}
	@media (hover: hover) and (pointer: fine) {
		textarea:hover:not(:disabled) {
			border-color: var(--line-strong);
		}
	}
	textarea:disabled {
		opacity: 0.6;
	}
	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.count {
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	@media (max-width: 760px) {
		textarea {
			/* WHY: under 16px iOS zooms the page when the field takes focus. */
			font-size: var(--fs-lg);
		}
		.foot :global(kbd) {
			display: none;
		}
	}
</style>

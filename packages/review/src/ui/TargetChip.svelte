<script lang="ts">
	import { kindOf } from "#src/core/beats.js";
	import { clock, percent } from "#src/core/format.js";
	import type { IconName, NoteTarget } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";

	let { target, onclear }: { target: NoteTarget; onclear?: () => void } = $props();
	const app = useApp();
	const model = $derived(app.review.model);

	const view = $derived.by((): { icon: IconName; text: string } => {
		switch (target.kind) {
			case "video":
				return { icon: "video", text: "Whole video" };
			case "beat": {
				const beat = model?.beats.find((item) => item.id === target.beat);
				const kind = beat && model ? kindOf(model, beat.kind) : undefined;
				return {
					icon: kind?.icon ?? "video",
					text: beat ? `${kind?.label ?? beat.kind} at ${beat.at}` : "A change",
				};
			}
			case "text":
				return {
					icon: "quote",
					text: target.quote.length > 42 ? `${target.quote.slice(0, 42)}...` : target.quote,
				};
			case "time": {
				const when = target.span
					? `${clock(target.at)} to ${clock(target.at + target.span)}`
					: clock(target.at);
				const where = target.frame
					? target.frame.w !== undefined
						? `, area at ${percent(target.frame.x)}%`
						: `, point at ${percent(target.frame.x)}%`
					: "";
				return {
					icon: target.frame ? "frame" : target.span ? "span" : "clock",
					text: when + where,
				};
			}
		}
	});
</script>

<span class="target chip">
	<Icon name={view.icon} small />
	<span class="text">{view.text}</span>
	{#if onclear}<button class="x" aria-label="Clear the pin" onclick={onclear}
			><Icon name="x" small /></button
		>{/if}
</span>

<style>
	.target {
		max-width: 100%;
		min-width: 0;
	}
	.text {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.x {
		display: grid;
		place-items: center;
		margin-right: -3px;
		color: var(--faint);
		border-radius: var(--radius-xs);
		transition: color var(--duration-quick) var(--ease-smooth-out);
	}
	.x:hover {
		color: var(--text);
	}
</style>

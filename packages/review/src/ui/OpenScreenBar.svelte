<script lang="ts">
	import Icon from "#src/components/icons/Icon.svelte";
	import { hostPost, OPENSCREEN_ROUTES, resultText } from "#src/core/openscreen.js";
	import type { Tone } from "#src/core/types.js";

	let { id, onSync }: { id: string; onSync?: () => Promise<void> } = $props();

	let busy = $state<"" | "preview" | "sync" | "export">("");
	let message = $state<{ tone: Tone; text: string } | null>(null);

	async function run(what: "preview" | "sync" | "export") {
		if (!id || busy) return;
		busy = what;
		message = null;
		const result = await hostPost(OPENSCREEN_ROUTES[what], { name: id });
		if (result.ok) {
			if (what === "sync") await onSync?.();
			message = {
				tone: "ok",
				text: result.out
					? "Done."
					: what === "preview"
						? "Now open in OpenScreen."
						: "The cuts are in the edit.",
			};
		} else {
			message = { tone: "bad", text: resultText(result) };
		}
		busy = "";
	}
</script>

<div class="bar">
	<span class="tag">OpenScreen</span>
	<button class="btn solid" disabled={busy !== ""} onclick={() => void run("preview")}>
		<Icon name="play" small /> Preview
	</button>
	<button class="btn solid" disabled={busy !== ""} onclick={() => void run("sync")}>
		<Icon name="refresh" small /> Sync cuts
	</button>
	<button class="btn solid" disabled={busy !== ""} onclick={() => void run("export")}>
		<Icon name="send" small /> Export
	</button>
	{#if message}
		<span class="note tone-{message.tone}" role="status">{message.text}</span>
	{/if}
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: none;
		padding: 6px var(--gutter);
		border-bottom: 1px solid var(--line-soft);
		background: var(--surface);
	}
	.tag {
		margin-right: 4px;
		color: var(--faint);
		font-size: var(--fs-xs);
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	.note {
		min-width: 0;
		overflow: hidden;
		color: var(--tone);
		font-size: var(--fs-xs);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

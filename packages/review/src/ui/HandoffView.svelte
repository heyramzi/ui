<script lang="ts">
	import { isOpenBeat, stateOf } from "#src/core/beats.js";
	import { plural } from "#src/core/format.js";
	import type { Pass } from "#src/core/types.js";
	import { useApp } from "#src/hooks/app.svelte.js";
	import Empty from "#src/ui/Empty.svelte";
	import { askForScript } from "#src/ui/handoff.js";
	import PassHead from "#src/ui/PassHead.svelte";

	let { pass }: { pass: Pass } = $props();
	const app = useApp();
	const model = $derived(app.review.model);
	const beats = $derived((model?.beats ?? []).filter((beat) => !beat.orphaned));
	const left = $derived(beats.filter(isOpenBeat).length);
	const kept = $derived(beats.filter((beat) => stateOf(beat) === "approved").length);
	const skipped = $derived(beats.filter((beat) => stateOf(beat) === "skipped").length);
	let sent = $state(false);

	function send() {
		sent = true;
		askForScript(app);
		setTimeout(() => (sent = false), 4000);
	}
</script>

<section class="handoff" data-view="handoff">
	<PassHead {pass} />
	<Empty
		icon="check"
		title={left === 0 ? "Everything has an answer" : `${plural(left, "change")} still to decide`}
		hint="{kept} kept, {skipped} skipped. Your agent updates the video to match."
	>
		<button class="btn primary" disabled={sent || app.review.session === "offline"} onclick={send}
			>{sent ? "Sent" : "Send to agent"}</button
		>
	</Empty>
</section>

<style>
	.handoff {
		padding: 20px var(--gutter) 64px;
	}
</style>

<script lang="ts">
	import Icon from "#src/components/icons/Icon.svelte";
	import OpenScreenNotice from "#src/ui/OpenScreenNotice.svelte";
	import {
		FEATURES_OFF,
		hostPost,
		OPENSCREEN_ROUTES,
		gateOpen,
		pairBody,
		pairProblem,
		readFeatures,
		resultText,
		type Features,
	} from "#src/core/openscreen.js";
	import type { Tone } from "#src/core/types.js";

	let {
		say,
		features,
		onFeatures,
	}: { say?: string; features?: Features; onFeatures?: (features: Features) => void } = $props();

	// svelte-ignore state_referenced_locally
	let ready = $state<Features | null>(features ?? null);
	let name = $state("");
	let screen = $state("");
	let camera = $state("");
	let offset = $state<string | number>(0);
	let pairOpen = $state(false);
	let busy = $state<"" | "record" | "pair">("");
	let copied = $state(false);
	let message = $state<{ tone: Tone; text: string } | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function getFeatures(): Promise<Features> {
		try {
			const response = await fetch(OPENSCREEN_ROUTES.features, {
				headers: { accept: "application/json" },
			});
			return readFeatures(await response.json().catch(() => null));
		} catch {
			return FEATURES_OFF;
		}
	}

	$effect(() => {
		if (features) {
			ready = features;
			onFeatures?.(features);
			return;
		}
		let live = true;
		void getFeatures().then((found) => {
			if (!live) return;
			ready = found;
			onFeatures?.(found);
		});
		return () => {
			live = false;
		};
	});

	async function record() {
		const called = name.trim();
		if (!called) {
			message = { tone: "bad", text: "Name the video first." };
			return;
		}
		busy = "record";
		message = null;
		const result = await hostPost(OPENSCREEN_ROUTES.record, { name: called });
		message = result.ok
			? { tone: "ok", text: "Recording. OpenScreen is up." }
			: { tone: "bad", text: resultText(result) };
		busy = "";
	}

	async function pair() {
		const problem = pairProblem({ name, screen });
		if (problem) {
			message = { tone: "bad", text: problem };
			return;
		}
		busy = "pair";
		message = null;
		const result = await hostPost(
			OPENSCREEN_ROUTES.pair,
			pairBody({ name, screen, camera, offset }),
		);
		if (result.ok) {
			pairOpen = false;
			message = { tone: "ok", text: "Paired. Open it in OpenScreen, or record it." };
		} else {
			message = { tone: "bad", text: resultText(result) };
		}
		busy = "";
	}

	async function copy() {
		if (!say) return;
		clearTimeout(copyTimer);
		try {
			await navigator.clipboard.writeText(say);
			copied = true;
		} catch {
			copied = false;
		}
		copyTimer = setTimeout(() => (copied = false), 1800);
	}

	function submitPair(event: SubmitEvent) {
		event.preventDefault();
		void pair();
	}
</script>

{#if gateOpen(ready)}
	<section class="start">
		<h2>Start with</h2>
		<div class="cards">
			<article class="card">
				<div class="top">
					<span class="badge"><Icon name="video" /></span>
					<div>
						<h3>Descript</h3>
						<p>What you use today.</p>
					</div>
				</div>
				{#if say}
					<div class="say">
						<q>{say}</q>
						<button class="btn solid" onclick={() => void copy()}
							>{copied ? "Copied" : "Copy"}</button
						>
					</div>
				{/if}
			</article>
			<article class="card">
				<div class="top">
					<span class="badge"><Icon name="plug" /></span>
					<h3>OpenScreen</h3>
				</div>
				{#if ready && !ready.openscreenInstalled}
					<OpenScreenNotice />
				{:else}
					<label class="field">
						<span>Video name</span>
						<input bind:value={name} placeholder="My first video" autocomplete="off" />
					</label>
					<div class="row">
						<button class="btn primary" disabled={busy !== ""} onclick={() => void record()}>
							<Icon name="play" small /> Record in OpenScreen
						</button>
						<button
							class="btn solid"
							aria-pressed={pairOpen}
							disabled={busy !== ""}
							onclick={() => (pairOpen = !pairOpen)}
						>
							<Icon name="plug" small /> Pair 2 files
						</button>
					</div>
					{#if pairOpen}
						<form class="pair" onsubmit={submitPair}>
							<label class="field">
								<span>Screen recording</span>
								<input bind:value={screen} placeholder="/Users/you/screen.mov" autocomplete="off" />
							</label>
							<label class="field">
								<span>Camera recording</span>
								<input bind:value={camera} placeholder="/Users/you/camera.mov" autocomplete="off" />
							</label>
							<label class="field">
								<span>Camera delay (seconds)</span>
								<input type="number" step="0.1" bind:value={offset} />
							</label>
							<button class="btn primary" type="submit" disabled={busy !== ""}>Pair</button>
						</form>
					{/if}
				{/if}
				{#if message}
					<p class="note tone-{message.tone}" role="status">{message.text}</p>
				{/if}
			</article>
		</div>
	</section>
{/if}

<style>
	.start {
		display: grid;
		gap: 14px;
	}
	h2 {
		font: 600 var(--fs-md) / 1.2 var(--display);
		letter-spacing: -0.01em;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
		gap: 14px;
	}
	.card {
		display: grid;
		align-content: start;
		gap: 12px;
		padding: 16px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
	}
	.top {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.badge {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		flex: none;
		border-radius: var(--radius-sm);
		background: var(--raised);
		color: var(--dim);
	}
	h3 {
		font-size: var(--fs-sm);
		font-weight: 600;
	}
	.top p {
		color: var(--faint);
		font-size: var(--fs-xs);
	}
	.say {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.say q {
		flex: 1;
		min-width: 0;
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.pair {
		display: grid;
		gap: 8px;
	}
	.field {
		display: grid;
		gap: 4px;
	}
	.field span {
		color: var(--dim);
		font-size: var(--fs-xs);
		font-weight: 500;
	}
	input {
		min-height: 32px;
		padding: 0 9px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--ground);
		color: var(--text);
		font-size: var(--fs-xs);
	}
	input::placeholder {
		color: var(--faint);
	}
	.note {
		color: var(--tone);
		font-size: var(--fs-xs);
	}
</style>

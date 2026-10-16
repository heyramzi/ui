<script lang="ts">
	import Icon from "#src/components/icons/Icon.svelte";
	import OpenScreenNotice from "#src/ui/OpenScreenNotice.svelte";
	import {
		FEATURES_OFF,
		hostPost,
		OPENSCREEN_ROUTES,
		readFeatures,
		resultText,
		type Features,
	} from "#src/core/openscreen.js";
	import type { Tone } from "#src/core/types.js";

	let { features, onFeatures }: { features?: Features; onFeatures?: (features: Features) => void } =
		$props();

	// svelte-ignore state_referenced_locally
	let ready = $state<Features | null>(features ?? null);
	const id = $props.id();
	let busy = $state(false);
	let message = $state<{ tone: Tone; text: string } | null>(null);
	const on = $derived(ready?.openscreen === true);

	async function load() {
		try {
			const response = await fetch(OPENSCREEN_ROUTES.features, {
				headers: { accept: "application/json" },
			});
			ready = readFeatures(await response.json().catch(() => null));
		} catch {
			ready = FEATURES_OFF;
		}
		onFeatures?.(ready);
	}

	$effect(() => {
		if (features) {
			ready = features;
			onFeatures?.(features);
			return;
		}
		void load();
	});

	async function toggle() {
		busy = true;
		message = null;
		const result = await hostPost(OPENSCREEN_ROUTES.features, { openscreen: !on });
		if (!result.ok) message = { tone: "bad", text: resultText(result) };
		else await load();
		busy = false;
	}
</script>

<section class="labs">
	<div class="top">
		<span class="badge"><Icon name="plug" /></span>
		<h2>Labs</h2>
	</div>
	<div class="row">
		<button
			class="switch"
			role="switch"
			aria-checked={on}
			disabled={busy || !ready}
			aria-labelledby="{id}-label"
			onclick={() => void toggle()}
		>
			<span class="knob"></span>
		</button>
		<div class="label">
			<b id="{id}-label">OpenScreen recording (experimental)</b>
		</div>
	</div>
	{#if ready && !ready.openscreenInstalled}
		<OpenScreenNotice />
	{/if}
	{#if message}
		<p class="note tone-{message.tone}" role="status">{message.text}</p>
	{/if}
</section>

<style>
	.labs {
		display: grid;
		gap: 14px;
		margin-top: 28px;
		padding: 18px;
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
	h2 {
		font: 600 var(--fs-sm) / 1.2 var(--display);
	}
	.row {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}
	.label {
		display: grid;
		gap: 2px;
	}
	.label b {
		font-size: var(--fs-xs);
		font-weight: 600;
	}
	.switch {
		position: relative;
		width: 40px;
		height: 22px;
		flex: none;
		margin-top: 1px;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--ground);
		transition:
			background-color var(--duration-quick) var(--ease-smooth-out),
			border-color var(--duration-quick) var(--ease-smooth-out);
	}
	.switch::before {
		content: "";
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--dim);
		transition:
			translate var(--duration-quick) var(--ease-smooth-out),
			background-color var(--duration-quick) var(--ease-smooth-out);
	}
	.switch[aria-checked="true"] {
		background: var(--accent-soft);
		border-color: var(--accent-line);
	}
	.switch[aria-checked="true"]::before {
		translate: 18px 0;
		background: var(--accent);
	}
	.switch:disabled {
		opacity: 0.5;
	}
	.note {
		color: var(--tone);
		font-size: var(--fs-xs);
	}
	@media (prefers-reduced-motion: reduce) {
		.switch,
		.switch::before {
			transition: none;
		}
	}
</style>

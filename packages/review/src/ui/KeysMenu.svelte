<script lang="ts">
	import { useApp } from "#src/hooks/app.svelte.js";
	import Icon from "#src/components/icons/Icon.svelte";
	import Kbd from "#src/ui/Kbd.svelte";

	const app = useApp();
	let wrap = $state<HTMLElement>();

	$effect(() => {
		const offs = [
			app.keys.bind({
				id: "keys.menu",
				keys: ["?"],
				label: "Show the keyboard shortcuts",
				group: "Everywhere",
				run: () => void (app.keysOpen = !app.keysOpen),
			}),
			app.keys.bind({
				id: "keys.close",
				keys: ["escape"],
				label: "Close the menu",
				group: "Everywhere",
				inInput: true,
				enabled: () => app.keysOpen,
				run: () => void (app.keysOpen = false),
			}),
		];
		return () => offs.forEach((off) => off());
	});

	$effect(() => {
		if (!app.keysOpen) return;
		const away = (event: PointerEvent) => {
			if (event.target instanceof Node && !wrap?.contains(event.target)) app.keysOpen = false;
		};
		document.addEventListener("pointerdown", away);
		return () => document.removeEventListener("pointerdown", away);
	});
</script>

<div class="wrap" bind:this={wrap}>
	<button
		class="btn icon"
		aria-label="Keyboard shortcuts"
		aria-expanded={app.keysOpen}
		aria-haspopup="dialog"
		aria-pressed={app.keysOpen}
		data-tip="Keyboard shortcuts (?)"
		onclick={() => (app.keysOpen = !app.keysOpen)}
	>
		<Icon name="keys" />
	</button>
	<div
		class="pop"
		data-open={app.keysOpen}
		role="dialog"
		aria-label="Keyboard shortcuts"
		inert={!app.keysOpen}
	>
		{#each app.keys.groups as { group, items } (group)}
			<section>
				<h2>{group}</h2>
				<ul>
					{#each items as item (item.id)}
						<li>
							<span class="label">{item.label}</span>
							<span class="combo">
								{#if item.display}
									<kbd>{item.display}</kbd>
								{:else}
									{#each item.keys as key, i (key)}
										{#if i > 0}<span class="or">or</span>{/if}<Kbd combo={key} />
									{/each}
								{/if}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
</div>

<style>
	.wrap {
		position: relative;
	}
	.pop {
		position: absolute;
		z-index: 50;
		top: calc(100% + 8px);
		right: 0;
		width: min(340px, calc(100vw - 2 * var(--gutter)));
		max-height: min(70vh, 560px);
		overflow-y: auto;
		padding: 6px 8px 10px;
		border-radius: var(--radius-lg);
		background: var(--surface);
		box-shadow: var(--shadow-pop);
		transform-origin: top right;
		opacity: 0;
		visibility: hidden;
		transform: scale(var(--scale-tiny));
		transition:
			opacity var(--dropdown-close-dur) var(--ease-smooth-out),
			transform var(--dropdown-close-dur) var(--ease-smooth-out),
			visibility 0s linear var(--dropdown-close-dur);
	}
	.pop[data-open="true"] {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition:
			opacity var(--dropdown-open-dur) var(--ease-smooth-out),
			transform var(--dropdown-open-dur) var(--ease-smooth-out),
			visibility 0s;
	}
	@starting-style {
		.pop[data-open="true"] {
			opacity: 0;
			transform: scale(var(--dropdown-pre-scale));
		}
	}
	h2 {
		margin: 10px 4px 4px;
		color: var(--faint);
		font-size: var(--fs-xs);
		font-weight: 600;
	}
	li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 30px;
		padding: 0 4px;
		border-radius: var(--radius-sm);
		font-size: var(--fs-xs);
	}
	li:hover {
		background: var(--hover);
	}
	.label {
		color: var(--text);
	}
	.combo {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		flex: none;
	}
	.or {
		color: var(--faint);
		font-size: var(--fs-xs);
	}
</style>

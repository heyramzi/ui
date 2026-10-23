<script lang="ts">
	let {
		value = $bindable(""),
		label,
		placeholder,
	}: { value?: string; label: string; placeholder: string } = $props();
</script>

<!-- Its own class name: the studio's shelf styles `.find` for the header search, and those rules would win here. -->
<label class="lib-find">
	<span class="sr">{label}</span>
	<svg viewBox="0 0 16 16" aria-hidden="true"
		><circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" /></svg
	>
	<input type="search" {placeholder} bind:value autocomplete="off" spellcheck="false" />
</label>

<style>
	/* The same field as the header search: 32px, a magnifier on the left. */
	.lib-find {
		position: relative;
		display: flex;
		align-items: center;
		width: min(320px, 100%);
		margin-bottom: 28px;
	}
	svg {
		position: absolute;
		left: 10px;
		width: 14px;
		height: 14px;
		fill: none;
		stroke: var(--dim);
		stroke-width: 1.7;
		stroke-linecap: round;
		pointer-events: none;
	}
	input {
		width: 100%;
		height: 32px;
		box-sizing: border-box;
		padding: 0 10px 0 30px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: var(--fs-sm);
	}
	input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
</style>

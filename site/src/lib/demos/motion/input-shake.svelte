<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
	import { cssNum } from "#lib/demos/motion/css-num.js";

	let shakeWrap: HTMLElement | null = null;
	let shakeInput: HTMLElement | null = null;
	let shakeRevert: ReturnType<typeof setTimeout> | undefined;

	function showError() {
		if (!shakeWrap || !shakeInput) return;
		shakeWrap.classList.add("is-error");
		shakeInput.classList.add("is-error");
		// Replay the shake from a clean baseline.
		shakeInput.classList.remove("is-shaking");
		void shakeInput.offsetWidth;
		shakeInput.classList.add("is-shaking");
		const shakeMs = cssNum("--shake-dur-a", 80) * 2 + cssNum("--shake-dur-b", 60) * 2;
		setTimeout(() => shakeInput?.classList.remove("is-shaking"), shakeMs + 20);
		if (shakeRevert) clearTimeout(shakeRevert);
		const hold = cssNum("--revert-hold", 3000);
		shakeRevert = setTimeout(() => {
			shakeWrap?.classList.remove("is-error");
			shakeInput?.classList.remove("is-error");
		}, shakeMs + hold);
	}
</script>

<DemoStage
	title="Error state shake"
	note="Percussive shake with auto-revert"
	importPath={"import '@heyramzi/ui/animations/input-shake.css';"}
	actionLabel="Submit"
	onaction={showError}
>
	<div bind:this={shakeWrap} class="t-input-wrap shake-wrap">
		<div bind:this={shakeInput} class="t-input shake-input">name@email</div>
		<p class="t-error-msg shake-msg">Enter a valid email address.</p>
	</div>
</DemoStage>

<style>
	.shake-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 13rem;
	}
	.shake-input {
		display: flex;
		align-items: center;
		height: 2.5rem;
		padding: 0 0.75rem;
		border: 1.5px solid var(--border);
		border-radius: 8px;
		background: var(--td-material-bg);
		color: var(--td-text-subtle);
		font-size: 0.875rem;
	}
	.shake-input.is-error {
		border-color: var(--destructive);
	}
	.shake-msg {
		margin: 0;
		font-size: 0.75rem;
		color: var(--destructive);
	}
</style>

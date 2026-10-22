<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";

	let thinkEl: HTMLElement | null = null;

	const THINK_STATES = ["Thinking...", "Reading the repository...", "Drafting the patch..."];

	// Runs on its own: the thinking line swaps state on a hold.
	$effect(() => {
		const think = thinkEl;
		if (!think) return;

		let state = 0;
		const swap = setInterval(() => {
			state = (state + 1) % THINK_STATES.length;
			think.classList.add("is-exit");
			setTimeout(() => {
				think.textContent = THINK_STATES[state];
				think.dataset.text = THINK_STATES[state];
				think.classList.remove("is-exit");
				think.classList.add("is-enter-start");
				void think.offsetHeight;
				think.classList.remove("is-enter-start");
			}, 200);
		}, 2000);

		return () => clearInterval(swap);
	});
</script>

<DemoStage
	title="Thinking states"
	note="Shimmering line, swapped on a hold"
	importPath={"import '@heyramzi/ui/animations/thinking-states.css';"}
>
	<span class="t-think think-demo" role="status">
		<span class="t-think-sizer" aria-hidden="true">Reading the repository...</span>
		<span bind:this={thinkEl} class="t-think-text" data-text="Thinking...">Thinking...</span>
	</span>
</DemoStage>

<style>
	.think-demo {
		font-size: 0.9375rem;
		color: var(--td-text-subtle);
	}
</style>

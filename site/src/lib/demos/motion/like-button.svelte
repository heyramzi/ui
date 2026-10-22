<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
	import heart from "#lib/demos/motion/heart.svg?raw";

	let liked = $state(false);
	let bursting = $state(false);

	// A spray nobody can predict: every dot takes its own angle, distance and
	// clock, which is what keeps two likes from looking like one animation.
	function toggleLike(event: MouseEvent) {
		liked = !liked;
		if (!liked) return;
		const root = event.currentTarget as HTMLElement;
		for (const dot of root.querySelectorAll<HTMLElement>(".t-like-particles i")) {
			const angle = Math.random() * Math.PI * 2;
			const dist = 14 + Math.random() * 14;
			dot.style.setProperty("--px", `${Math.cos(angle) * dist}px`);
			dot.style.setProperty("--py", `${Math.sin(angle) * dist}px`);
			dot.style.setProperty("--pdur", `${480 + Math.random() * 240}ms`);
			dot.style.setProperty("--pdelay", `${Math.random() * 60}ms`);
			dot.style.setProperty("--psize", `${0.7 + Math.random() * 0.8}`);
		}
		bursting = false;
		void root.offsetHeight;
		bursting = true;
		setTimeout(() => (bursting = false), 700);
	}
</script>

<DemoStage
	title="Like button"
	note="Heart fills, particles spray"
	importPath={"import '@heyramzi/ui/animations/like-button.css';"}
>
	<button
		type="button"
		class="t-like like-demo"
		class:is-bursting={bursting}
		data-liked={liked ? "true" : "false"}
		aria-pressed={liked}
		onclick={toggleLike}
	>
		<span class="t-like-icon">
			{@html heart}
		</span>
		<span class="t-like-particles" aria-hidden="true">
			{#each { length: 8 } as _, i (i)}
				<i></i>
			{/each}
		</span>
		Like
	</button>
</DemoStage>

<style>
	.like-demo {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		padding: 0.5rem 0.875rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--td-text);
		background: var(--td-copy-bg);
		border: 0;
		border-radius: 8px;
		cursor: pointer;
	}
</style>

<script lang="ts">
	import DemoStage from "#lib/DemoStage.svelte";
	import { cssNum } from "#lib/demos/motion/css-num.js";

	let avatarRoot: HTMLElement | null = null;
	// Dummy team members so the hover-lift reads as a real avatar stack.
	const avatars = [
		{ initials: "RK", hue: 24 },
		{ initials: "KA", hue: 158 },
		{ initials: "AM", hue: 268 },
		{ initials: "MT", hue: 334 },
		{ initials: "ZL", hue: 200 },
	];

	function liftAvatars(activeIdx: number | null) {
		if (!avatarRoot) return;
		const lift = cssNum("--avatar-lift", -4);
		const falloff = cssNum("--avatar-falloff", 0.45);
		const scale = cssNum("--avatar-scale", 1.05);
		const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
		avatarRoot.querySelectorAll<HTMLElement>(".t-avatar").forEach((el, i) => {
			el.style.transitionTimingFunction = ease;
			if (activeIdx === null) {
				el.style.setProperty("--shift", "0px");
				el.style.setProperty("--scale-active", "1");
				return;
			}
			const d = Math.abs(i - activeIdx);
			el.style.setProperty("--shift", `${(lift * Math.pow(falloff, d)).toFixed(3)}px`);
			el.style.setProperty("--scale-active", i === activeIdx ? String(scale) : "1");
		});
	}
</script>

<DemoStage
	title="Avatar group hover"
	note="Distance falloff lift with spring return"
	importPath={"import '@heyramzi/ui/animations/avatar-group-hover.css';"}
>
	<div
		bind:this={avatarRoot}
		class="t-avatar-group avatar-row"
		role="group"
		aria-label="Team"
		onmouseleave={() => liftAvatars(null)}
	>
		{#each avatars as person, i (person.initials)}
			<div
				class="t-avatar avatar-chip"
				style="z-index: {avatars.length -
					i}; background: linear-gradient(145deg, hsl({person.hue} 52% 52%), hsl({person.hue} 56% 38%)); color: #fff;"
				onmouseenter={() => liftAvatars(i)}
			>
				{person.initials}
			</div>
		{/each}
	</div>
</DemoStage>

<style>
	.avatar-row {
		display: inline-flex;
	}
	.avatar-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.75rem;
		height: 2.75rem;
		margin-left: -0.625rem;
		border-radius: 50%;
		background: var(--td-material-bg);
		box-shadow: var(--td-material-shadow);
		border: 2px solid var(--td-stage-bg);
		color: var(--td-text);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: default;
	}
	.avatar-chip:first-child {
		margin-left: 0;
	}
</style>

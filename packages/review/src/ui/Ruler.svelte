<script lang="ts">
	import { clock, clockTenths } from "#src/core/format.js";

	let { duration, railW, hover }: { duration: number; railW: number; hover: number | null } =
		$props();

	// Majors stay at least 72px apart, whatever the zoom.
	const STEPS = [0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
	const WIDEST_STEP = 600;
	const ticks = $derived.by(() => {
		if (!duration || railW <= 0) return [];
		const perSecond = railW / duration;
		const major = STEPS.find((step) => step * perSecond >= 72) ?? WIDEST_STEP;
		const minor = major / 5;
		const out: { at: number; major: boolean; label: string }[] = [];
		for (let i = 0; i * minor <= duration + 0.001; i++) {
			const at = i * minor;
			const isMajor = i % 5 === 0;
			out.push({
				at,
				major: isMajor,
				label: isMajor ? (at < 60 ? `${+at.toFixed(1)}s` : clock(at)) : "",
			});
		}
		return out;
	});
	const pct = (seconds: number) =>
		duration ? Math.min(Math.max(seconds / duration, 0), 1) * 100 : 0;
</script>

<div class="ruler" aria-hidden="true">
	{#each ticks as tick (tick.at)}
		<i class="tick" class:major={tick.major} style:left="{pct(tick.at)}%"
			>{#if tick.label}<span class="num">{tick.label}</span>{/if}</i
		>
	{/each}
	{#if hover !== null}<span class="at num" style:left="{pct(hover)}%">{clockTenths(hover)}</span
		>{/if}
</div>

<style>
	.ruler {
		position: relative;
		height: 100%;
	}
	.tick {
		position: absolute;
		bottom: 0;
		width: 1px;
		height: 3px;
		background: var(--line);
	}
	.tick.major {
		height: 5px;
		background: var(--line-strong);
	}
	.tick span {
		position: absolute;
		bottom: 0;
		left: 4px;
		color: var(--faint);
		font: 500 var(--fs-xs) / 1 var(--mono);
		white-space: nowrap;
	}
	.at {
		position: absolute;
		z-index: 2;
		bottom: 0;
		translate: -50% 0;
		padding: 2px 5px;
		border-radius: var(--radius-xs);
		background: var(--text);
		color: var(--ground);
		font: 600 var(--fs-xs) / 1 var(--mono);
		pointer-events: none;
	}
</style>

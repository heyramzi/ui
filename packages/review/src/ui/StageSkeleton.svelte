<script lang="ts">
	// The stage before the model arrives, in the shape the host promised, so nothing moves when the video lands.
	// WHY its own sizing rules: Stage's are scoped to it. These copy its frame, phone and beside-the-pass sizes; change both together.
	let { ratio }: { ratio: number } = $props();
</script>

<section class="stage" aria-hidden="true">
	<div class="viewer">
		<div class="fit"><span class="frame skel" style:--ratio={ratio}></span></div>
		<div class="bar"><span class="skel clock"></span><span class="skel play"></span><span></span></div>
	</div>
	<div class="track"><span class="skel strip"></span></div>
</section>

<style>
	.stage {
		display: grid;
		gap: 10px;
		padding: 14px var(--gutter) 12px;
		border-bottom: 1px solid var(--line-soft);
		background: var(--surface);
	}
	.viewer {
		display: grid;
		justify-items: center;
		gap: 8px;
	}
	.fit {
		display: grid;
		justify-items: center;
		width: 100%;
	}
	.frame {
		width: min(100%, calc(min(46vh, 480px) * var(--ratio)));
		aspect-ratio: var(--ratio);
		border-radius: var(--radius);
	}
	.bar {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 12px;
		width: 100%;
		max-width: 640px;
	}
	.clock {
		width: 72px;
		height: 12px;
	}
	.play {
		width: 40px;
		height: 40px;
		border-radius: 50%;
	}
	/* A local edit's timeline: the ruler and 7 lanes, measured on the real one. */
	.strip {
		display: block;
		height: 196px;
	}
	@media (min-width: 901px) and (max-height: 899px) {
		.stage {
			gap: 6px;
			padding-block: 6px 8px;
		}
		.strip {
			height: 138px;
		}
		.frame {
			width: min(100%, calc(min(29vh, 480px) * var(--ratio)));
		}
	}
	@media (max-width: 900px) {
		.stage {
			box-sizing: border-box;
			height: var(--stage-h);
			align-content: start;
			gap: 0;
			padding: 8px var(--gutter) 4px;
			overflow: hidden;
		}
		.fit {
			align-items: center;
			height: var(--frame-h);
		}
		.frame {
			width: min(100%, calc(var(--frame-h) * var(--ratio)));
			max-height: var(--frame-h);
		}
		.track {
			display: none;
		}
	}
	@container main (min-width: 700px) {
		:global(.side) > .stage {
			display: contents;
		}
		:global(.side) .viewer {
			grid-area: viewer;
			grid-template-rows: minmax(0, 1fr) auto;
			min-width: 0;
			min-height: 0;
			padding: 18px var(--gutter) 14px;
			background: var(--ground);
			overflow: clip;
		}
		:global(.side) .fit {
			container-type: size;
			min-height: 0;
			align-items: center;
		}
		:global(.side) .frame {
			width: min(100cqw, calc(100cqh * var(--ratio)));
		}
		:global(.side) .bar {
			max-width: 420px;
		}
		:global(.side) .track {
			grid-area: track;
			padding: 12px var(--gutter);
			border-top: 1px solid var(--line-soft);
			background: var(--surface);
		}
	}
</style>

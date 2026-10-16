<script lang="ts">
	import { Spotlight } from "#src/index.js";
</script>

<div class="stage">
	<Spotlight class="-top-10 left-0 md:-top-20 md:left-20" fill="white" />
	<div class="content">
		<h4>Spotlight</h4>
		<p>A soft beam sweeps in over a dark surface on mount.</p>
	</div>
</div>

<style>
	.stage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		min-height: 8rem;
		overflow: hidden;
		border-radius: 0.5rem;
		background: #050505;
	}
	.content {
		z-index: 2;
		text-align: center;
		color: #f5f5f5;
	}
	.content h4 {
		margin: 0 0 0.25rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.content p {
		margin: 0;
		font-size: 0.8125rem;
		color: #a3a3a3;
	}
</style>

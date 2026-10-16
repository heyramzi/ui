<script lang="ts">
	import { Reasoning, ReasoningTrigger, ReasoningContent } from "#src/ai/index.js";
</script>

<div class="w">
	<Reasoning duration={4} open>
		<ReasoningTrigger />
		<ReasoningContent>
			AnimatedBeam already lives in @heyramzi/ui, so the fix is to re-export it and migrate the two
			consumers rather than copy the keyframes a third time.
		</ReasoningContent>
	</Reasoning>
</div>

<style>
	.w {
		width: 100%;
	}
</style>

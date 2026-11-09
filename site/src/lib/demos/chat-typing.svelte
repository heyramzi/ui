<script lang="ts">
	import { TypingDots } from "@heyramzi/ui/ai";
</script>

<div class="flex min-h-20 w-full flex-col items-center justify-center gap-4">
	<div class="flex flex-col items-center gap-2">
		<TypingDots />
		<p class="text-xs text-muted-foreground">Ada is typing</p>
	</div>
	<TypingDots label="Thinking" />
</div>

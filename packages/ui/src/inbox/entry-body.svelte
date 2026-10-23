<script lang="ts">
	import { cn } from "#src/lib/utils.js";

	interface Props {
		text: string;
		more: string;
		less: string;
		class?: string;
	}

	let { text, more, less, class: className }: Props = $props();

	let open = $state(false);
	let long = $derived(text.length > 420 || text.split("\n").length > 6);
</script>

<div class="flex flex-col items-start gap-1">
	<p
		class={cn(
			"text-sm leading-relaxed font-normal whitespace-pre-wrap text-pretty",
			long && !open && "line-clamp-6",
			className,
		)}
	>
		{text}
	</p>
	{#if long}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
			aria-expanded={open}
			onclick={() => (open = !open)}
		>
			{open ? less : more}
		</button>
	{/if}
</div>

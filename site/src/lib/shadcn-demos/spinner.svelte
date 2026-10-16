<script lang="ts">
	import { Spinner } from "@heyramzi/ui/shadcn/spinner";
</script>

<div class="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
	<div class="bg-muted/50 flex items-center gap-3 rounded-md border p-3 text-sm">
		<Spinner />
		<span class="line-clamp-1 flex-1 font-medium">Processing payment...</span>
		<span class="tabular-nums">$100.00</span>
	</div>
</div>

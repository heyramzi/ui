<script lang="ts">
// =========================
// IMPORTS
// =========================
import { cn } from "#src/lib/utils.js";
import type { PanelStat } from "#src/panel/side-panel-types.js";
import { gutterClass } from "#src/record/gutter.js";

// =========================
// PROPS
// =========================
interface Props {
	stats: PanelStat[];
	/** Sits flush with the record's gutter. Off inside a card. */
	gutter?: boolean;
	class?: string;
}
let { stats, gutter = true, class: className }: Props = $props();

// =========================
// DERIVED
// =========================
const TONE = {
	default: "",
	muted: "text-muted-foreground",
	good: "text-success",
	bad: "text-destructive",
} as const;
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#if stats.length > 0}
	<dl class={cn("flex flex-wrap gap-x-6 gap-y-2", gutter && gutterClass, className)}>
		{#each stats as stat (stat.label)}
			<div class="min-w-0">
				<dt class="text-xs text-muted-foreground">{stat.label}</dt>
				<dd class={cn("text-sm font-medium tabular-nums", TONE[stat.tone ?? "default"])}>
					{stat.value}
					{#if stat.sub}
						<span class="text-xs font-normal text-muted-foreground">{stat.sub}</span>
					{/if}
				</dd>
			</div>
		{/each}
	</dl>
{/if}

<script lang="ts">
// ========================= IMPORTS
import { Skeleton } from "#src/shadcn/skeleton/index.js";

// ========================= TYPES
type ColumnDef = {
	width?: string;
	align?: "left" | "center" | "right";
	/** Show a small circle before the skeleton bar (e.g. logo/avatar column) */
	circle?: boolean;
};

type Props = {
	/** Number of skeleton rows to render */
	rows?: number;
	/** Column definitions control skeleton widths and alignment */
	columns?: ColumnDef[];
	/** Simple mode: just specify column count */
	columnCount?: number;
	class?: string;
};

// ========================= PROPS
let {
	rows = 5,
	columns,
	columnCount = 6,
	class: className,
}: Props = $props();

// ========================= DERIVED
let cols = $derived(
	columns ??
		Array.from<unknown, ColumnDef>({ length: columnCount }, () => ({
			width: undefined,
			align: "left" as const,
		})),
);

const WIDTHS = ["w-24", "w-20", "w-28", "w-16", "w-32", "w-20"];
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<tbody class={className}>
	{#each { length: rows } as _, rowIdx (rowIdx)}
		<tr
			data-slot="table-row"
			class="border-b border-border/50 transition-opacity"
			style="animation: skeleton-fade-in var(--duration-slow) var(--ease-out) calc(var(--duration-stagger) * {rowIdx}) both"
		>
			{#each cols as col, colIdx (colIdx)}
				<td
					data-slot="table-cell"
					class="h-11 px-2 {col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}"
				>
					<div class="flex items-center gap-2 {col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : ''}">
						{#if col.circle}
							<Skeleton class="size-6 shrink-0 rounded-md" />
						{/if}
						<Skeleton
							class="h-3.5 rounded {col.width ?? WIDTHS[(rowIdx + colIdx) % WIDTHS.length]}"
						/>
					</div>
				</td>
			{/each}
		</tr>
	{/each}
</tbody>

<style>
	@keyframes skeleton-fade-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

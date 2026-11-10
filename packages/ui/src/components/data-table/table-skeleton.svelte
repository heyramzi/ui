<script lang="ts">
	// ========================= IMPORTS
	import { cn } from "#src/lib/utils.js";
	import { Skeleton } from "#src/shadcn/skeleton/index.js";

	// ========================= TYPES
	type ColumnDef = {
		width?: string;
		align?: "left" | "center" | "right";
		/** Show a small circle before the skeleton bar (e.g. logo/avatar column) */
		circle?: boolean;
		/** Merged onto the cell, for a table whose own cells pad, hide or rule differently. */
		class?: string;
	};

	interface Props {
		/** Number of skeleton rows to render */
		rows?: number;
		/** Column definitions control skeleton widths and alignment */
		columns?: ColumnDef[];
		/** Simple mode: just specify column count */
		columnCount?: number;
		/** Merged onto each row, for a table whose own rows draw a different line. */
		rowClass?: string;
		class?: string;
	}

	// ========================= PROPS
	let { rows = 5, columns, columnCount = 6, rowClass, class: className }: Props = $props();

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
		<!-- Placeholders, so a screen reader skips them rather than reading empty rows. -->
		<tr
			data-slot="table-row"
			class={cn("border-b border-border/70 transition-opacity", rowClass)}
			aria-hidden="true"
			style="animation: skeleton-fade-in var(--duration-slow) var(--ease-smooth-out) calc(var(--duration-stagger) * {rowIdx}) both"
		>
			{#each cols as col, colIdx (colIdx)}
				<td
					data-slot="table-cell"
					class={cn(
						"h-8 px-2 any-pointer-coarse:h-11",
						col.align === "center" && "text-center",
						col.align === "right" && "text-right",
						col.class,
					)}
				>
					<div
						class="flex items-center gap-2 {col.align === 'center'
							? 'justify-center'
							: col.align === 'right'
								? 'justify-end'
								: ''}"
					>
						{#if col.circle}
							<Skeleton class="size-5 shrink-0 rounded-full" />
						{/if}
						<Skeleton
							class="h-3 rounded-sm {col.width ?? WIDTHS[(rowIdx + colIdx) % WIDTHS.length]}"
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

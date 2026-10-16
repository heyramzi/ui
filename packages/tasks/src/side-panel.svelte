<script lang="ts" module>
/** How wide the panel opens from `sm` (a short form) to `2xl` (a reader). Under
    the `sm` breakpoint every panel is full width. */
export type SidePanelWidth = "sm" | "md" | "lg" | "xl" | "2xl";

/** One number the record is judged on. They sit in the header, in the order given. */
export type PanelStat = {
	label: string;
	value: string;
	/** A quiet note beside the value: the rate behind a count, or what the figure is. */
	sub?: string;
	/** One severity vocabulary: a count that should be zero is `bad`. */
	tone?: "default" | "muted" | "good" | "bad";
};
</script>

<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";
import * as Sheet from "@heyramzi/ui/shadcn/sheet";
import { OpenIn, type OpenInTool } from "@heyramzi/ui/components/open-in";
import { CopyButton } from "@heyramzi/ui/components/copy";
import type { Tone } from "@heyramzi/ui/lib/tone.js";
import { cn } from "@heyramzi/utils";
import StatusBadge from "./status-badge.svelte";

// =========================
// PROPS
// =========================
type Props = {
	open: boolean;
	/** Names the dialog for screen readers and heads the panel. */
	title: string;
	/** Merged onto the title. A short path is set `font-mono`, a subject is not. */
	titleClass?: string;
	/** The facts the record is filed under, read out under the title. */
	description?: string;
	/** Status chips, left of the action row. */
	badges?: { label: string; tone: Tone }[];
	/** Doors out to another tool. `text` replaces the tool's name on the button. */
	openIn?: { tool: OpenInTool; href: string; label: string; text?: string }[];
	/** A prompt for an AI about this record, copied on click. */
	handoff?: { value: () => string | Promise<string>; label: string; copiedLabel: string };
	/** The record's numbers, as a strip under the badges. Same place in every panel. */
	stats?: PanelStat[];
	/** Anything else the record can do, drawn last in the action row. */
	actions?: Snippet;
	/** Pinned actions. The body scrolls above it; the caller aligns the row. */
	footer?: Snippet;
	children: Snippet;
	width?: SidePanelWidth;
	/** The body brings its own header: the title is read out but not drawn, and
	    the body is neither padded nor scrolled by the panel. */
	bare?: boolean;
	/** Fires once when the panel closes, from the close button, Escape or the overlay. */
	onClose?: () => void;
};
let {
	open = $bindable(),
	title,
	titleClass,
	description,
	badges = [],
	openIn = [],
	handoff,
	stats = [],
	actions,
	footer,
	children,
	width = "sm",
	bare = false,
	onClose,
}: Props = $props();

// =========================
// STATE
// =========================
let panel = $state<HTMLElement | null>(null);

// =========================
// DERIVED
// =========================
let hasRow = $derived(badges.length > 0 || openIn.length > 0 || Boolean(handoff || actions));
const STAT_TONE = {
	default: "",
	muted: "text-muted-foreground",
	good: "text-success",
	bad: "text-destructive",
} as const;
const WIDTH: Record<SidePanelWidth, string> = {
	sm: "sm:max-w-sm",
	md: "sm:max-w-md",
	lg: "sm:max-w-xl",
	xl: "sm:max-w-2xl",
	"2xl": "sm:max-w-3xl",
};

// =========================
// HANDLERS
// =========================
// WHY focus goes to the panel unless a text field comes first: the dialog otherwise
// opens on its first control, which draws a ring on a record nobody has touched.
// A form that opens on its field keeps the default, since that is where you type.
const FIRST_CONTROL =
	'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';
function onOpenAutoFocus(event: Event) {
	if (!panel || panel.querySelector(FIRST_CONTROL)?.matches("input, textarea, select")) return;
	event.preventDefault();
	panel.focus();
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Sheet.Root
	bind:open
	onOpenChange={(next) => {
		if (!next) onClose?.();
	}}
>
	<Sheet.Content
		side="right"
		bind:ref={panel}
		tabindex={-1}
		class={cn("flex w-full flex-col gap-0 p-0", WIDTH[width], bare && "overflow-hidden")}
		{onOpenAutoFocus}
	>
		{#if bare}
			<Sheet.Header class="sr-only">
				<Sheet.Title>{title}</Sheet.Title>
			</Sheet.Header>
			{@render children()}
		{:else}
			<Sheet.Header class="gap-1 border-b border-border">
				<!-- WHY the right padding: the close button sits over this corner and
				     a long title runs straight under it. -->
				<Sheet.Title class={cn("pr-9 text-base leading-snug", titleClass)}>{title}</Sheet.Title>
				{#if description}
					<Sheet.Description>{description}</Sheet.Description>
				{/if}
				{#if hasRow}
					<div class="flex items-center justify-between gap-3 pt-1.5">
						<div class="flex min-w-0 flex-wrap items-center gap-2">
							{#each badges as badge (`${badge.tone}:${badge.label}`)}
								<StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
							{/each}
						</div>
						<div class="flex shrink-0 items-center gap-1">
							{#each openIn as door (door.href)}
								<OpenIn
									tool={door.tool}
									href={door.href}
									title={door.label}
									label={door.text}
									variant="button"
									size="sm"
								/>
							{/each}
							{#if handoff}
								<CopyButton
									agent
									value={handoff.value}
									label={handoff.label}
									copiedLabel={handoff.copiedLabel}
								/>
							{/if}
							{@render actions?.()}
						</div>
					</div>
				{/if}
				{#if stats.length > 0}
					<dl class="flex flex-wrap gap-x-6 gap-y-3 pt-3">
						{#each stats as stat (stat.label)}
							<div class="min-w-0">
								<dt class="text-xs text-muted-foreground">{stat.label}</dt>
								<dd class={cn("text-sm font-medium tabular-nums", STAT_TONE[stat.tone ?? "default"])}>
									{stat.value}
									{#if stat.sub}
										<span class="text-xs font-normal text-muted-foreground">{stat.sub}</span>
									{/if}
								</dd>
							</div>
						{/each}
					</dl>
				{/if}
			</Sheet.Header>

			<!-- WHY the body pads and spaces its sections itself: a panel that lets the
			     caller choose drifts, one with a grey band and one with a white page. -->
			<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
				{@render children()}
			</div>

			{#if footer}
				<Sheet.Footer class="mt-0 flex-row items-center justify-end border-t border-border">
					{@render footer()}
				</Sheet.Footer>
			{/if}
		{/if}
	</Sheet.Content>
</Sheet.Root>

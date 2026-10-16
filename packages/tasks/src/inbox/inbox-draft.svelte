<script lang="ts">
	import { Input } from "@heyramzi/ui/shadcn/input";
	import { Textarea } from "@heyramzi/ui/shadcn/textarea";
	import { ToggleGroup, ToggleGroupItem } from "@heyramzi/ui/shadcn/toggle-group";
	import { cn } from "@heyramzi/utils";
	import { insetWellClass } from "@heyramzi/ui/lib/panel.js";
	import type { InboxDraft, InboxDraftEdits } from "./inbox-types.js";

	type Props = {
		drafts: InboxDraft[];
		/** The template the agent picked. Marked in the picker. */
		recommended?: string;
		selected: string;
		/** What the person typed, by template. A template with no entry shows the agent's text. */
		edits: InboxDraftEdits;
		/** The person picked another template. */
		onpick: (templateId: string) => void;
		/** The body field, so a shortcut can focus it. */
		bodyEl?: HTMLTextAreaElement | null;
		disabled?: boolean;
		class?: string;
	};

	let {
		drafts,
		recommended,
		selected,
		onpick,
		edits = $bindable(),
		bodyEl = $bindable(null),
		disabled = false,
		class: className,
	}: Props = $props();

	let draft = $derived(drafts.find((d) => d.templateId === selected) ?? drafts[0]);
	let text = $derived(edits[draft.templateId] ?? { subject: draft.subject, body: draft.body });
	let edited = $derived(text.subject !== draft.subject || text.body !== draft.body);

	function write(patch: Partial<{ subject: string; body: string }>) {
		edits[draft.templateId] = { ...text, ...patch };
	}
</script>

<div class={cn(insetWellClass, "flex flex-col gap-2", className)}>
	{#if drafts.length > 1}
		<ToggleGroup
			type="single"
			variant="outline"
			size="sm"
			value={selected}
			onValueChange={(next) => next && onpick(next)}
			aria-label="Reply template"
			class="flex-wrap"
		>
			{#each drafts as d (d.templateId)}
				<ToggleGroupItem value={d.templateId} {disabled}>
					{d.label}
					{#if d.templateId === recommended}
						<span class="text-muted-foreground text-xs font-normal">suggested</span>
					{/if}
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>
	{/if}

	<Input
		value={text.subject}
		oninput={(event) => write({ subject: event.currentTarget.value })}
		aria-label="Subject"
		{disabled}
		class="bg-background"
	/>
	<Textarea
		bind:ref={bodyEl}
		value={text.body}
		oninput={(event) => write({ body: event.currentTarget.value })}
		aria-label="Email body"
		{disabled}
		class="bg-background min-h-28 text-sm"
	/>
	<p class="text-muted-foreground text-xs" aria-live="polite">
		{edited ? "Edited by you. Send uses your text." : "The agent's draft. Edit it before you send."}
	</p>
</div>

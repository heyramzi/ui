<script lang="ts">
// =========================
// IMPORTS
// =========================
import { Check, CaretUpDown } from "phosphor-svelte";
import { cn } from "#src/lib/utils.js";
import { Button } from "#src/shadcn/button/index.js";
import { Input } from "#src/shadcn/input/index.js";
import { Textarea } from "#src/shadcn/textarea/index.js";
import { Spinner } from "#src/shadcn/spinner/index.js";
import * as Select from "#src/shadcn/select/index.js";
import * as Popover from "#src/shadcn/popover/index.js";
import * as Command from "#src/shadcn/command/index.js";
import StatusBadge from "#src/tasks/status-badge.svelte";
import { resolveLabels, type InfoRow, type RecordLabels } from "#src/tasks/record/types.js";

// =========================
// PROPS
// =========================
interface Props {
	rows: InfoRow[];
	/** A heading over the list. Left out, nothing is drawn. */
	title?: string | null;
	labels?: Partial<RecordLabels>;
	class?: string;
}
let { rows, title = null, labels, class: className }: Props = $props();

// =========================
// STATE
// =========================
let editing = $state<string | null>(null);
let draft = $state("");
let saving = $state<string | null>(null);
let failed = $state<{ key: string; text: string } | null>(null);
let pickerOpen = $state<string | null>(null);

// =========================
// DERIVED
// =========================
let t = $derived(resolveLabels(labels));
// A read-only row with nothing in it is noise. An editable one stays, as the way to fill it.
let shown = $derived(
	rows.filter(
		(r) => r.divider || r.onSave || (r.value != null && r.value !== "") || (r.chips?.length ?? 0) > 0,
	),
);
// Past this many options a plain list is slower than typing.
const SEARCH_AT = 7;

// =========================
// FUNCTIONS
// =========================
const keyOf = (row: InfoRow) => row.id ?? row.label;

function isEmpty(row: InfoRow): boolean {
	return (row.value == null || row.value === "") && (row.chips?.length ?? 0) === 0;
}

function inputType(row: InfoRow): string {
	return row.input === "date" || row.input === "number" || row.input === "url" || row.input === "email"
		? row.input
		: "text";
}

function begin(row: InfoRow) {
	editing = keyOf(row);
	failed = null;
	const from = row.editValue ?? row.value ?? "";
	draft = Array.isArray(from) ? from.join(", ") : String(from);
}

function stop() {
	editing = null;
	failed = null;
	draft = "";
}

async function commit(row: InfoRow, value: string | string[], close = true) {
	if (!row.onSave) return;
	const key = keyOf(row);
	const next = Array.isArray(value) ? value : value.trim();
	if (row.required && (Array.isArray(next) ? next.length === 0 : next === "")) {
		failed = { key, text: t.required };
		return;
	}
	saving = key;
	failed = null;
	try {
		await row.onSave(next);
		if (close) stop();
	} catch {
		failed = { key, text: t.saveFailed };
	} finally {
		saving = null;
	}
}

function pick(row: InfoRow, value: string) {
	pickerOpen = null;
	const current = typeof row.editValue === "string" ? row.editValue : null;
	if (value !== current) void commit(row, value, false);
}

function toggle(row: InfoRow, value: string) {
	const current = Array.isArray(row.editValue) ? row.editValue : [];
	const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
	void commit(row, next, false);
}

// Enter saves a line. A long text keeps Enter for the line break and saves on Cmd or Ctrl.
function onKey(event: KeyboardEvent, row: InfoRow) {
	if (event.key === "Escape") {
		event.preventDefault();
		stop();
	} else if (event.key === "Enter" && (row.input !== "longtext" || event.metaKey || event.ctrlKey)) {
		event.preventDefault();
		void commit(row, draft);
	}
}

// The ghost button that opens an editor reads as text until hovered, so a read
// of the record isn't a page of controls.
const OPENER = "-ml-1.5 max-w-full px-1.5 text-sm font-medium";
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
{#snippet display(row: InfoRow)}
	{#if row.chips?.length}
		<span class="flex flex-wrap items-center gap-1">
			{#each row.chips as chip (chip.label)}
				<StatusBadge tone={chip.tone ?? "neutral"} capitalize={false}>{chip.label}</StatusBadge>
			{/each}
		</span>
	{:else if row.tone && row.value}
		<StatusBadge tone={row.tone} capitalize={false}>{row.value}</StatusBadge>
	{:else if row.href && row.value}
		<a href={row.href} class="min-w-0 truncate text-sm font-medium underline-offset-2 hover:underline"
			>{row.value}</a
		>
	{:else if row.value}
		<span
			class={cn(
				"min-w-0 text-sm font-medium tabular-nums wrap-anywhere whitespace-pre-line",
				row.muted && "text-muted-foreground",
			)}>{row.value}</span
		>
	{:else}
		<span class="text-sm font-normal text-muted-foreground">{t.add(row.label)}</span>
	{/if}
{/snippet}

{#snippet list(row: InfoRow, key: string, multi: boolean)}
	{@const options = row.options ?? []}
	{@const current = multi
		? Array.isArray(row.editValue)
			? row.editValue
			: []
		: [typeof row.editValue === "string" ? row.editValue : ""]}
	<Popover.Root open={pickerOpen === key} onOpenChange={(open) => (pickerOpen = open ? key : null)}>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="text"
					size="sm"
					class={OPENER}
					aria-label={t.edit(row.label)}
					disabled={saving === key}
				>
					{@render display(row)}
					{#if saving === key}
						<Spinner class="size-3.5 text-muted-foreground" />
					{:else if !multi}
						<CaretUpDown class="size-3.5 shrink-0 opacity-60" />
					{/if}
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-64 p-0" align="start">
			<Command.Root>
				<Command.Input placeholder={t.search} />
				<Command.List class="max-h-72 overflow-y-auto">
					<Command.Empty>{t.noMatch}</Command.Empty>
					<Command.Group>
						{#each options as option (option.value)}
							<Command.Item
								value={option.label}
								onSelect={() => (multi ? toggle(row, option.value) : pick(row, option.value))}
							>
								<Check
									class={cn("size-3.5", current.includes(option.value) ? "opacity-100" : "opacity-0")}
								/>
								{option.label}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
{/snippet}

{#if shown.length > 0}
	<div class={cn("flex flex-col gap-2", className)}>
		{#if title}
			<h2 class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</h2>
		{/if}
		<dl class="grid grid-cols-[minmax(5rem,max-content)_minmax(0,1fr)] items-start gap-x-4 gap-y-2.5">
			{#each shown as row, index (row.divider ? `divider-${index}` : keyOf(row))}
				{#if row.divider}
					<div class="col-span-2 -my-0.5 border-t border-border/50"></div>
				{:else}
					{@const key = keyOf(row)}
					{@const long = row.input === "longtext"}
					<dt
						class={cn(
							"flex min-h-7 items-center gap-2 text-sm text-muted-foreground",
							long && "col-span-2 min-h-0",
						)}
					>
						{#if row.icon}
							{@const Icon = row.icon}
							<Icon class="size-3.5 shrink-0" aria-hidden="true" />
						{/if}
						{row.label}
					</dt>
					<dd class={cn("flex min-h-7 min-w-0 flex-col justify-center gap-1", long && "col-span-2 -mt-1")}>
						{#if !row.onSave}
							{@render display(row)}
						{:else if row.input === "multi" && row.options}
							{@render list(row, key, true)}
						{:else if row.input === "select" && row.options && row.options.length > SEARCH_AT}
							{@render list(row, key, false)}
						{:else if row.input === "select" && row.options}
							<Select.Root
								type="single"
								value={typeof row.editValue === "string" ? row.editValue : ""}
								onValueChange={(next) => next && pick(row, next)}
								disabled={saving === key}
							>
								<Select.Trigger
									size="sm"
									aria-label={t.edit(row.label)}
									class="-ml-1.5 min-h-7 h-auto w-fit max-w-full gap-1.5 border-transparent bg-transparent px-1.5 shadow-none transition-colors hover:bg-muted/60 focus-visible:ring-3 data-[state=open]:bg-muted/60"
								>
									<span data-slot="select-value" class="flex min-w-0 items-center gap-1.5">
										{@render display(row)}
									</span>
									{#if saving === key}
										<Spinner class="size-3.5 text-muted-foreground" />
									{/if}
								</Select.Trigger>
								<Select.Content>
									{#each row.options as option (option.value)}
										<Select.Item value={option.value} label={option.label}>{option.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{:else if editing === key}
							<div class="flex flex-col gap-1.5">
								{#if long}
									<Textarea
										rows={4}
										bind:value={draft}
										aria-label={t.edit(row.label)}
										aria-required={row.required}
										placeholder={row.placeholder}
										disabled={saving === key}
										onkeydown={(e: KeyboardEvent) => onKey(e, row)}
									/>
								{:else}
									<Input
										class="h-7 text-sm"
										type={inputType(row)}
										inputmode={row.input === "number" ? "decimal" : undefined}
										bind:value={draft}
										aria-label={t.edit(row.label)}
										aria-required={row.required}
										placeholder={row.placeholder}
										disabled={saving === key}
										onkeydown={(e: KeyboardEvent) => onKey(e, row)}
									/>
								{/if}
								<div class="flex items-center gap-1.5">
									<Button size="sm" disabled={saving === key} onclick={() => commit(row, draft)}>
										{#if saving === key}<Spinner class="size-3.5" />{/if}
										{t.save}
									</Button>
									<Button size="sm" variant="ghost" disabled={saving === key} onclick={stop}>
										{t.cancel}
									</Button>
								</div>
							</div>
						{:else}
							<Button
								variant="text"
								size="sm"
								class={cn(OPENER, isEmpty(row) && "text-muted-foreground")}
								aria-label={t.edit(row.label)}
								onclick={() => begin(row)}
							>
								{@render display(row)}
							</Button>
						{/if}
						{#if failed?.key === key}
							<p class="text-xs text-destructive" role="alert">{failed.text}</p>
						{/if}
					</dd>
				{/if}
			{/each}
		</dl>
	</div>
{/if}

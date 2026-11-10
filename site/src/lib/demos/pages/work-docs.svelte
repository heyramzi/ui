<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { docLooks } from "@heyramzi/ui/components/work-parts";
	import { Bell, FileText, LinkSimple, Star } from "phosphor-svelte";
	import { DocEditorPage, DocMenu, EditedChip, type CopyKind } from "@heyramzi/ui/work/docs";
	import * as Breadcrumb from "@heyramzi/ui/shadcn/breadcrumb";
	import { Toggle } from "@heyramzi/ui/shadcn/toggle";

	// =========================
	// TYPES
	// =========================
	type Node = Record<string, unknown>;

	// =========================
	// CONTENT
	// =========================
	const text = (value: string, marks?: Node[]): Node => ({
		type: "text",
		text: value,
		marks,
	});
	const p = (...parts: (string | Node)[]): Node => ({
		type: "paragraph",
		content: parts.map((part) => (typeof part === "string" ? text(part) : part)),
	});
	const h = (level: number, value: string): Node => ({
		type: "heading",
		attrs: { level },
		content: [text(value)],
	});
	const task = (value: string, checked = false): Node => ({
		type: "taskItem",
		attrs: { checked },
		content: [p(value)],
	});
	const cell = (type: "tableHeader" | "tableCell", value: string): Node => ({
		type,
		content: [p(value)],
	});
	const row = (type: "tableHeader" | "tableCell", ...values: string[]): Node => ({
		type: "tableRow",
		content: values.map((value) => cell(type, value)),
	});

	const content: Node = {
		type: "doc",
		content: [
			h(2, "Why this exists"),
			p(
				"The weekly report used to be copied by hand from ClickUp into a sheet. It took an hour and the numbers drifted. This doc says how the sync works, what it leaves out and what's still open.",
			),
			h(2, "How it works"),
			p(
				"Every night a job reads the tasks changed that day and writes one row per task. It never deletes a row. A task that moves lists keeps its row and gets a new ",
				text("list", [{ type: "code" }]),
				" value.",
			),
			h(3, "What a row holds"),
			{
				type: "table",
				content: [
					row("tableHeader", "Column", "Source", "Notes"),
					row("tableCell", "Task", "name", "Linked back to ClickUp"),
					row("tableCell", "Owner", "assignees[0]", "First assignee only"),
					row("tableCell", "Hours", "time tracked", "Summed per day"),
				],
			},
			h(3, "The job"),
			{
				type: "codeBlock",
				attrs: { language: "typescript" },
				content: [
					text(
						'export async function syncDay(day: string) {\n  const tasks = await clickup.changedOn(day);\n  const rows = tasks.map(toRow);\n  await sheet.upsert(rows, { key: "id" });\n}',
					),
				],
			},
			h(2, "Before it ships"),
			{
				type: "taskList",
				content: [
					task("Backfill the last four weeks", true),
					task("Decide what a deleted task does to its row"),
					task("Give finance read access to the sheet"),
				],
			},
			{
				type: "blockquote",
				content: [
					p(
						"A report nobody trusts is worse than no report. Row counts get checked against ClickUp every Monday.",
					),
				],
			},
			h(2, "Open questions"),
			p(
				"Subtasks are flattened into their parent today. If finance wants hours per subtask, the key changes from the task id to the pair of ids, and the backfill runs again.",
			),
		],
	};

	// =========================
	// STATE
	// =========================
	let title = $state("ClickUp to Sheets");
	let favorited = $state(false);
	let showAuthors = $state(false);
	let editedAt = $state<Date>(new Date("2026-10-21T09:12:00"));
	let note = $state("");

	// =========================
	// DERIVED
	// =========================
	let latest = $state<Node>(content);

	const owner = { name: "Ramzi Tabka" };

	// =========================
	// FUNCTIONS
	// =========================
	function touched(json: Record<string, unknown>) {
		latest = json;
		editedAt = new Date();
	}

	function said(what: string) {
		note = what;
	}

	function copied(kind: CopyKind) {
		said(`Copied ${kind === "link" ? "title as link" : kind}`);
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="flex flex-col gap-2">
	<div
		class="h-[min(48rem,calc(100svh-9rem))] overflow-hidden {docLooks.frame} border border-border bg-card"
	>
		<DocEditorPage
			bind:title
			{content}
			onContentChange={touched}
			onCopyLink={() => said("Copied link to section")}
		>
			{#snippet breadcrumb()}
				<Breadcrumb.Root class="min-w-0">
					<Breadcrumb.List class="min-w-0 flex-nowrap gap-1 text-(length:--text-control) sm:gap-1">
						<Breadcrumb.Item class="flex min-w-0 gap-1.5 @max-xl/doc:hidden">
							<FileText size={14} aria-hidden="true" />
							<span class="truncate">Reporting</span>
						</Breadcrumb.Item>
						<Breadcrumb.Separator class="px-0.5 text-muted-foreground/60 @max-xl/doc:hidden"
							>›</Breadcrumb.Separator
						>
						<Breadcrumb.Item class="min-w-0">
							<Breadcrumb.Page class="flex min-w-0 items-center gap-1.5 font-medium">
								<FileText size={14} class="shrink-0 text-muted-foreground" aria-hidden="true" />
								<span class="truncate">{title.trim() || "New document"}</span>
							</Breadcrumb.Page>
						</Breadcrumb.Item>
					</Breadcrumb.List>
				</Breadcrumb.Root>
			{/snippet}

			{#snippet menu()}
				<Toggle
					bind:pressed={favorited}
					aria-label={favorited ? "Remove from favorites" : "Favorite"}
				>
					{#snippet child({ props })}
						<button
							{...props}
							class="t-press inline-flex size-7 items-center justify-center {docLooks.control} text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] outline-none hover:bg-foreground/6 hover:text-foreground focus-visible:shadow-(--ring-focus) any-pointer-coarse:size-10"
						>
							<Star
								aria-hidden="true"
								size={15}
								weight={favorited ? "fill" : "regular"}
								class={favorited ? "text-brand" : ""}
							/>
						</button>
					{/snippet}
				</Toggle>
				<DocMenu
					{title}
					url="https://ui.heyramzi.com/work/docs"
					content={latest}
					{favorited}
					onMove={() => said("Move to")}
					onDuplicate={() => said("Duplicated")}
					onRename={() => said("Rename")}
					onTemplate={() => said("Template created")}
					onFavorite={() => (favorited = !favorited)}
					onCopy={copied}
					onRemind={() => said("Remind me")}
					onHistory={() => said("History")}
					onDelete={() => said("Deleted")}
				/>
			{/snippet}

			{#snippet meta()}
				<EditedChip
					{editedAt}
					{owner}
					lastEditor={owner}
					showAuthorNames={showAuthors}
					onShowAuthorNamesChange={(next) => (showAuthors = next)}
					onHistory={() => said("History")}
				/>
			{/snippet}

			{#snippet actions()}
				{@const button = `t-press inline-flex size-7 items-center justify-center ${docLooks.control} text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] outline-none hover:bg-foreground/6 hover:text-foreground focus-visible:shadow-(--ring-focus) any-pointer-coarse:size-10`}
				<button
					type="button"
					aria-label="Copy link"
					class="{button} @max-xl/doc:hidden"
					onclick={() => said("Copied URL")}
				>
					<LinkSimple aria-hidden="true" size={15} />
				</button>
				<button
					type="button"
					aria-label="Subscribe"
					class={button}
					onclick={() => said("Subscribed")}
				>
					<Bell aria-hidden="true" size={15} />
				</button>
			{/snippet}
		</DocEditorPage>
	</div>
	<p class="h-4 text-xs text-muted-foreground" aria-live="polite">{note}</p>
</div>

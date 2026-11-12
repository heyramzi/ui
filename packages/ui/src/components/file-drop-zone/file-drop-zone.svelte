<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import {
		File as FileIcon,
		FileCsv,
		FileImage,
		FilePdf,
		FileXls,
		UploadSimple,
		WarningCircle,
		X,
	} from "phosphor-svelte";
	import { cn } from "#src/lib/utils.js";
	import * as Attachment from "#src/shadcn/attachment/index.js";
	import {
		checkFiles,
		describeLimits,
		fileKind,
		formatSize,
		removeFile,
		type Rejection,
	} from "#src/components/file-drop-zone/files.js";

	// =========================
	// TYPES
	// =========================
	interface Labels {
		/** The zone's first line. Defaults to the singular or plural by `multiple`. */
		title: string;
		/** The muted line under it. */
		subtitle: string;
		/** The first line while a file is dragged over the zone. */
		dragging: string;
		/** The line with the accepted types and size. Built from `accept` and `maxFileSize` when left out. */
		hint: string;
		remove: (name: string) => string;
		tooLarge: (name: string, max: string) => string;
		wrongType: (name: string) => string;
		tooMany: (max: number) => string;
	}

	interface Props {
		/** The file input's name: what the form post carries the files under. */
		name?: string;
		/** The id of the real input, for an outside `<label for>`. */
		id?: string;
		/** Same syntax as the input's `accept`: `.pdf`, `application/pdf`, `image/*`. */
		accept?: string;
		multiple?: boolean;
		/** Most files the list holds when `multiple` is set. */
		maxFiles?: number;
		/** Largest file, in bytes. */
		maxFileSize?: number;
		required?: boolean;
		disabled?: boolean;
		/** Takes files pasted anywhere on the page. */
		capturePaste?: boolean;
		/** The chosen files. Kept in step with the real input, so a plain form post sends them. */
		files?: File[];
		/** Called with the files a drop, a paste or the picker just added. */
		onUpload?: (added: File[]) => void;
		/** Called with each file turned away and why. */
		onFileRejected?: (rejected: Rejection[]) => void;
		labels?: Partial<Labels>;
		class?: string;
	}

	// =========================
	// PROPS
	// =========================
	let {
		name,
		id,
		accept,
		multiple = false,
		maxFiles,
		maxFileSize,
		required = false,
		disabled = false,
		capturePaste = false,
		files = $bindable([]),
		onUpload,
		onFileRejected,
		labels,
		class: className,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	const uid = $props.id();
	let input = $state<HTMLInputElement | null>(null);
	// dragenter and dragleave fire for every child the pointer crosses, so the zone counts them.
	let depth = $state(0);
	let rejected = $state<Rejection[]>([]);

	// =========================
	// DERIVED
	// =========================
	const inputId = $derived(id ?? `${uid}-input`);
	const text: Labels = $derived({
		title: multiple ? "Glissez vos fichiers ici" : "Glissez votre fichier ici",
		subtitle: multiple ? "ou cliquez pour les choisir" : "ou cliquez pour le choisir",
		dragging: multiple ? "Déposez vos fichiers" : "Déposez votre fichier",
		hint: describeLimits(accept, maxFileSize),
		remove: (file) => `Retirer ${file}`,
		tooLarge: (file, max) => `${file} : fichier trop lourd, ${max} maximum`,
		wrongType: (file) => `${file} : format non accepté`,
		tooMany: (max) => (max === 1 ? "Un seul fichier à la fois" : `${max} fichiers au maximum`),
		...labels,
	});
	const dragging = $derived(depth > 0);
	// One file without `multiple` takes the zone's place, and removing it brings the zone back.
	const showZone = $derived(multiple || files.length === 0);
	const room = $derived(multiple ? (maxFiles ?? Infinity) : 1);
	const messages = $derived([
		...new Set(
			rejected.map(({ file, reason }) =>
				reason === "type"
					? text.wrongType(file.name)
					: reason === "size"
						? text.tooLarge(file.name, formatSize(maxFileSize ?? 0))
						: text.tooMany(room),
			),
		),
	]);

	// =========================
	// EFFECTS
	// =========================
	// The real input always holds the list, so `use:enhance` and a plain multipart post both carry it.
	$effect(() => {
		const list = files;
		if (!input || typeof DataTransfer === "undefined") return;
		// Already in step (the picker just wrote it, or both are empty): writing again would only churn.
		const held = [...(input.files ?? [])];
		if (held.length === list.length && held.every((file, index) => file === list[index])) return;
		const transfer = new DataTransfer();
		for (const file of list) transfer.items.add(file);
		input.files = transfer.files;
	});

	$effect(() => {
		if (!capturePaste || disabled) return;
		const onPaste = (event: ClipboardEvent) => {
			const pasted = [...(event.clipboardData?.files ?? [])];
			if (pasted.length === 0) return;
			event.preventDefault();
			take(pasted);
		};
		window.addEventListener("paste", onPaste);
		return () => window.removeEventListener("paste", onPaste);
	});

	// =========================
	// FUNCTIONS
	// =========================
	function take(incoming: File[]) {
		if (disabled || incoming.length === 0) return;
		const next = checkFiles(incoming, files, { accept, maxFileSize, maxFiles, multiple });
		rejected = next.rejected;
		files = next.files;
		if (next.accepted.length > 0) onUpload?.(next.accepted);
		if (next.rejected.length > 0) onFileRejected?.(next.rejected);
	}

	function remove(file: File) {
		files = removeFile(files, file);
		rejected = [];
		if (files.length === 0 && !multiple) queueMicrotask(() => input?.focus());
	}

	const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false;

	function onDragEnter(event: DragEvent) {
		if (disabled || !hasFiles(event)) return;
		event.preventDefault();
		depth += 1;
	}

	function onDragOver(event: DragEvent) {
		if (disabled || !hasFiles(event)) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
	}

	function onDragLeave(event: DragEvent) {
		if (disabled || !hasFiles(event)) return;
		depth = Math.max(0, depth - 1);
	}

	function onDrop(event: DragEvent) {
		depth = 0;
		if (disabled) return;
		event.preventDefault();
		take([...(event.dataTransfer?.files ?? [])]);
	}

	function onChange() {
		// The picker replaces input.files. take() merges it with the list, and the effect writes the list back.
		take([...(input?.files ?? [])]);
	}

	// Space opens a file input natively. Enter doesn't everywhere, and must never submit the form.
	function onKey(event: KeyboardEvent) {
		if (event.key !== "Enter") return;
		event.preventDefault();
		input?.click();
	}

	// One blob URL per image thumbnail, freed when its file leaves the list or the zone unmounts.
	const urls = new Map<File, string>();
	function thumb(file: File) {
		let url = urls.get(file);
		if (!url) urls.set(file, (url = URL.createObjectURL(file)));
		return url;
	}
	$effect(() => {
		const live = new Set(files);
		for (const [file, url] of urls) {
			if (live.has(file)) continue;
			URL.revokeObjectURL(url);
			urls.delete(file);
		}
	});
	$effect(() => () => {
		for (const url of urls.values()) URL.revokeObjectURL(url);
		urls.clear();
	});
	const canPreview = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
</script>

{#snippet kindIcon(file: File)}
	{@const kind = fileKind(file)}
	{#if kind === "pdf"}
		<FilePdf weight="regular" aria-hidden="true" />
	{:else if kind === "image"}
		<FileImage weight="regular" aria-hidden="true" />
	{:else if kind === "csv"}
		<FileCsv weight="regular" aria-hidden="true" />
	{:else if kind === "sheet"}
		<FileXls weight="regular" aria-hidden="true" />
	{:else}
		<FileIcon weight="regular" aria-hidden="true" />
	{/if}
{/snippet}

<div
	data-slot="file-drop-zone"
	data-dragging={dragging || undefined}
	data-disabled={disabled || undefined}
	class={cn("flex w-full min-w-0 flex-col gap-2", className)}
	role="presentation"
	ondragenter={onDragEnter}
	ondragover={onDragOver}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	<input
		bind:this={input}
		id={inputId}
		type="file"
		class="peer sr-only"
		{name}
		{accept}
		{multiple}
		{required}
		{disabled}
		tabindex={showZone ? undefined : -1}
		aria-describedby={messages.length > 0 ? `${uid}-errors` : undefined}
		onchange={onChange}
		onkeydown={onKey}
	/>
	{#if showZone}
		<label
			for={inputId}
			data-slot="file-drop-zone-target"
			data-dragging={dragging || undefined}
			class={cn(
				"group/zone flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-input bg-muted/40 px-6 py-7 text-center",
				"transition-[border-color,background-color,box-shadow] duration-quick ease-smooth-out motion-reduce:transition-none",
				"hover:border-foreground/30 hover:bg-muted/70",
				"peer-focus-visible:border-ring peer-focus-visible:shadow-[var(--ring-focus)]",
				"data-dragging:border-solid data-dragging:border-primary data-dragging:bg-primary/6",
				disabled && "pointer-events-none cursor-not-allowed opacity-50",
			)}
		>
			<span
				aria-hidden="true"
				class="mb-3 grid size-10 place-items-center rounded-lg bg-background text-muted-foreground shadow-[var(--elev-hairline)] transition-[translate,color] duration-fast ease-smooth-out group-hover/zone:text-foreground group-data-dragging/zone:-translate-y-0.5 group-data-dragging/zone:text-primary motion-reduce:transition-none motion-reduce:group-data-dragging/zone:translate-y-0"
			>
				<UploadSimple class="size-5" weight="regular" aria-hidden="true" />
			</span>
			<span class="text-sm font-medium text-foreground">
				{dragging ? text.dragging : text.title}
			</span>
			<span class="text-sm text-muted-foreground">{text.subtitle}</span>
			{#if text.hint}
				<span class="mt-2 text-xs text-muted-foreground tabular-nums">{text.hint}</span>
			{/if}
		</label>
	{/if}

	{#if files.length > 0}
		<ul class="flex flex-col gap-1.5" data-slot="file-drop-zone-list">
			{#each files as file (file)}
				<li class="min-w-0">
					<Attachment.Root class="w-full" data-file-name={file.name}>
						{#if canPreview && fileKind(file) === "image"}
							<Attachment.Media variant="image">
								<img alt="" src={thumb(file)} />
							</Attachment.Media>
						{:else}
							<Attachment.Media>{@render kindIcon(file)}</Attachment.Media>
						{/if}
						<Attachment.Content>
							<Attachment.Title title={file.name}>{file.name}</Attachment.Title>
							<Attachment.Description class="tabular-nums">
								{formatSize(file.size)}
							</Attachment.Description>
						</Attachment.Content>
						<Attachment.Actions>
							<Attachment.Action
								type="button"
								aria-label={text.remove(file.name)}
								{disabled}
								onclick={() => remove(file)}
							>
								<X weight="bold" aria-hidden="true" />
							</Attachment.Action>
						</Attachment.Actions>
					</Attachment.Root>
				</li>
			{/each}
		</ul>
	{/if}

	<div id="{uid}-errors" aria-live="polite" class="empty:hidden">
		{#each messages as message (message)}
			<p class="flex items-start gap-1.5 text-sm text-destructive">
				<WarningCircle class="mt-0.5 size-4 shrink-0" weight="regular" aria-hidden="true" />
				<span class="min-w-0 break-words">{message}</span>
			</p>
		{/each}
	</div>
</div>

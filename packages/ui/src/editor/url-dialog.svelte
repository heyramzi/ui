<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { Button } from "#src/shadcn/button/index.js";
	import * as Dialog from "#src/shadcn/dialog/index.js";
	import { SimpleField } from "#src/shadcn/field/index.js";
	import { Input } from "#src/shadcn/input/index.js";

	// =========================
	// TYPES
	// =========================
	interface Props {
		open: boolean;
		heading: string;
		label: string;
		placeholder: string;
		/** Adds an optional second field under the link, with this label. */
		titleLabel?: string;
		/** Inserts from the fields, then answers the error to show, or null once it's done. */
		onSubmit: (url: string, title: string) => string | null;
		/** Focus goes back to the text, whichever way the dialog closed. */
		onClosed: () => void;
	}

	// =========================
	// PROPS
	// =========================
	let {
		open = $bindable(),
		heading,
		label,
		placeholder,
		titleLabel,
		onSubmit,
		onClosed,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	const uid = $props.id();
	let url = $state("");
	let title = $state("");
	let error = $state<string | null>(null);

	// =========================
	// FUNCTIONS
	// =========================
	function submit(e: SubmitEvent) {
		e.preventDefault();
		error = onSubmit(url.trim(), title.trim());
		if (!error) open = false;
	}

	function reset(e: Event) {
		e.preventDefault();
		url = "";
		title = "";
		error = null;
		onClosed();
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<Dialog.Root bind:open>
	<Dialog.Content onCloseAutoFocus={reset}>
		<form class="contents" novalidate onsubmit={submit}>
			<Dialog.Header>
				<Dialog.Title>{heading}</Dialog.Title>
			</Dialog.Header>
			<Dialog.Body>
				<SimpleField {label} for="{uid}-url" error={error ?? undefined}>
					<Input
						id="{uid}-url"
						type="url"
						bind:value={url}
						{placeholder}
						oninput={() => (error = null)}
					/>
				</SimpleField>
				{#if titleLabel}
					<SimpleField label={titleLabel} for="{uid}-title">
						<Input id="{uid}-title" bind:value={title} />
					</SimpleField>
				{/if}
			</Dialog.Body>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit">Insert</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<script lang="ts">
	import { cn } from "#src/lib/utils.js";
	import type { Snippet } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import Field from "#src/shadcn/field/field.svelte";
	import FieldLabel from "#src/shadcn/field/field-label.svelte";
	import FieldDescription from "#src/shadcn/field/field-description.svelte";
	import FieldError from "#src/shadcn/field/field-error.svelte";

	interface Props {
		label?: string;
		description?: string;
		error?: string;
		/** Id of the control the label binds to. Also picks the control that gets the message link. */
		for?: string;
		/** "default" is text-sm foreground; "muted" is a text-xs micro-label. */
		labelVariant?: "default" | "muted";
		class?: string;
		children: Snippet;
	}

	let {
		label,
		description,
		error,
		for: htmlFor,
		labelVariant = "default",
		class: className,
		children,
	}: Props = $props();

	const uid = $props.id();
	const messageId = `${uid}-message`;
	let message = $derived(error ?? description);

	// WHY an attachment: the control is the caller's snippet, so the wrapper can't
	// set its props. Wiring the DOM here means no call site can forget the link.
	const CONTROL = "input, textarea, select, [role=combobox], [role=switch], [role=checkbox]";
	const link: Attachment<HTMLElement> = (node) => {
		if (!message) return;
		const control =
			(htmlFor ? node.querySelector<HTMLElement>(`[id="${CSS.escape(htmlFor)}"]`) : null) ??
			node.querySelector<HTMLElement>(CONTROL);
		if (!control) return;
		const before = control.getAttribute("aria-describedby");
		control.setAttribute("aria-describedby", [before, messageId].filter(Boolean).join(" "));
		if (error) control.setAttribute("aria-invalid", "true");
		return () => {
			if (before === null) control.removeAttribute("aria-describedby");
			else control.setAttribute("aria-describedby", before);
			if (error) control.removeAttribute("aria-invalid");
		};
	};
</script>

<Field class={cn("gap-2", className)} data-invalid={error ? "true" : undefined} {@attach link}>
	{#if label}
		<FieldLabel
			for={htmlFor}
			class={labelVariant === "muted" ? "text-muted-foreground text-xs" : undefined}
		>
			{label}
		</FieldLabel>
	{/if}
	{@render children()}
	{#if error}
		<FieldError id={messageId} class="text-xs">{error}</FieldError>
	{:else if description}
		<FieldDescription id={messageId} class="text-xs">{description}</FieldDescription>
	{/if}
</Field>

<script lang="ts">
	import InlineEditor, {
		type InlineDoc,
		type InlineEditorApi,
	} from "@heyramzi/ui/editor/inline-editor";
	import "@heyramzi/ui/editor/content.css";
	import { Button } from "@heyramzi/ui/shadcn/button";
	import { TextB, TextItalic, ListBullets } from "phosphor-svelte";

	let doc = $state<InlineDoc>({
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: [
					{ type: "text", text: "Call Northwind about the " },
					{ type: "text", text: "revised scope", marks: [{ type: "bold" }] },
					{ type: "text", text: " before Friday." },
				],
			},
			{
				type: "bulletList",
				content: [
					{
						type: "listItem",
						content: [
							{ type: "paragraph", content: [{ type: "text", text: "Send the updated quote" }] },
						],
					},
					{
						type: "listItem",
						content: [
							{ type: "paragraph", content: [{ type: "text", text: "Book the handover session" }] },
						],
					},
				],
			},
		],
	});
	let api = $state<InlineEditorApi>();
</script>

<div class="w-full max-w-md rounded-xl border border-border bg-card">
	<div class="flex items-center gap-1 border-b border-border p-1.5">
		<Button variant="ghost" size="sm" icon aria-label="Bold" onclick={() => api?.toggle("bold")}
			><TextB class="size-4" /></Button
		>
		<Button variant="ghost" size="sm" icon aria-label="Italic" onclick={() => api?.toggle("italic")}
			><TextItalic class="size-4" /></Button
		>
		<Button
			variant="ghost"
			size="sm"
			icon
			aria-label="Bullet list"
			onclick={() => api?.toggle("bulletList")}><ListBullets class="size-4" /></Button
		>
	</div>
	<InlineEditor
		{doc}
		placeholder="Write a note"
		class="tiptap-content min-h-28 p-3 text-sm outline-none"
		onchange={(next) => (doc = next)}
		onexit={() => api?.focus()}
		onready={(a) => (api = a)}
	/>
</div>

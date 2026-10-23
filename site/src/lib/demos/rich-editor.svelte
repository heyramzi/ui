<script lang="ts">
	import { RichEditor } from "@heyramzi/ui/editor";

	let doc = $state<Record<string, unknown> | null>({
		type: "doc",
		content: [
			{ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Write here" }] },
			{
				type: "paragraph",
				content: [{ type: "text", text: "Type a slash for headings, lists, tables and images." }],
			},
		],
	});
</script>

<div class="w-full max-w-2xl rounded-xl border border-border bg-card p-4">
	<RichEditor content={doc} onchange={(json) => (doc = json)} minHeight="14rem" />
</div>

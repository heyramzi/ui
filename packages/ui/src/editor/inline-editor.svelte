<script lang="ts" module>
	// The tiptap side of a small in-place text field (a canvas card). It speaks ProseMirror JSON
	// and hands the host a plain `InlineEditorApi`, so no tiptap type leaks out.
	export type InlineDoc = Record<string, unknown>;

	export type InlineCommand =
		| "bold"
		| "italic"
		| "strike"
		| "bulletList"
		| "orderedList"
		| "taskList";

	export type InlineEditorApi = {
		toggle: (command: InlineCommand) => void;
		setLink: (href: string | null) => void;
		isActive: (name: string) => boolean;
		linkHref: () => string;
		hasSelection: () => boolean;
		/** Types at the caret, replacing any selection. */
		insertText: (text: string) => void;
		setDoc: (doc: InlineDoc) => void;
		getDoc: () => InlineDoc;
		focus: () => void;
	};
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import {
		Editor,
		Extension,
		Node as TiptapNode,
		mergeAttributes,
		wrappingInputRule,
	} from "@tiptap/core";
	import { StarterKit } from "@tiptap/starter-kit";
	import { Placeholder } from "@tiptap/extension-placeholder";
	import { untrack } from "svelte";

	// =========================
	// TYPES
	// =========================
	interface Props {
		doc: InlineDoc;
		placeholder?: string;
		class?: string;
		/** Marks only: bold, italic, strike, code and link. No lists, so a table cell stays a line of words. */
		inline?: boolean;
		/** Where the click landed, so the caret opens there. Without it the caret goes to the end. */
		at?: { x: number; y: number };
		/** Opens with all the text selected, so the first key replaces it. */
		selectAll?: boolean;
		/** Opens with the text replaced by these characters and the caret after them. */
		seed?: string;
		onchange: (doc: InlineDoc) => void;
		onexit: () => void;
		onlink?: () => void;
		onstate?: () => void;
		onready?: (api: InlineEditorApi) => void;
	}

	// =========================
	// PROPS
	// =========================
	let {
		doc,
		placeholder = "",
		class: klass = "",
		inline = false,
		at,
		selectAll = false,
		seed,
		onchange,
		onexit,
		onlink,
		onstate,
		onready,
	}: Props = $props();

	// =========================
	// STATE
	// =========================
	let element: HTMLDivElement | undefined = $state();

	// =========================
	// CONSTANTS
	// =========================
	const TaskList = TiptapNode.create({
		name: "taskList",
		group: "block list",
		content: "taskItem+",
		parseHTML: () => [{ tag: 'ul[data-type="taskList"]' }],
		renderHTML: ({ HTMLAttributes }) => [
			"ul",
			mergeAttributes(HTMLAttributes, { "data-type": "taskList" }),
			0,
		],
		addInputRules() {
			return [wrappingInputRule({ find: /^\s*\[\s?\]\s$/, type: this.type })];
		},
	});

	// A checklist item. Its box is a real input, so a tick is one transaction and one undo step.
	const TaskItem = TiptapNode.create({
		name: "taskItem",
		content: "paragraph",
		defining: true,
		addAttributes() {
			return { checked: { default: false, keepOnSplit: false } };
		},
		parseHTML: () => [{ tag: 'li[data-type="taskItem"]', priority: 51 }],
		renderHTML: ({ node, HTMLAttributes }) => [
			"li",
			mergeAttributes(HTMLAttributes, {
				"data-type": "taskItem",
				"data-checked": String(node.attrs.checked),
			}),
			0,
		],
		addKeyboardShortcuts() {
			return {
				Enter: () => this.editor.commands.splitListItem(this.name),
				"Shift-Tab": () => this.editor.commands.liftListItem(this.name),
			};
		},
		addNodeView() {
			return ({ node, getPos, editor }) => {
				let current = node;
				const li = document.createElement("li");
				li.dataset.type = "taskItem";
				const label = document.createElement("label");
				label.contentEditable = "false";
				const input = document.createElement("input");
				input.type = "checkbox";
				label.append(input);
				const body = document.createElement("div");
				li.append(label, body);
				const paint = () => {
					li.dataset.checked = String(current.attrs.checked);
					input.checked = current.attrs.checked === true;
				};
				paint();
				input.addEventListener("change", () => {
					const pos = getPos();
					if (typeof pos !== "number") return;
					editor
						.chain()
						.command(({ tr }) => {
							tr.setNodeMarkup(pos, undefined, { ...current.attrs, checked: input.checked });
							return true;
						})
						.run();
				});
				return {
					dom: li,
					contentDOM: body,
					update(next) {
						if (next.type !== current.type) return false;
						current = next;
						paint();
						return true;
					},
				};
			};
		},
	});

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		if (!element) return;
		const host = element;
		return untrack(() => build(host));
	});

	function build(host: HTMLElement) {
		const keys = Extension.create({
			name: "cardKeys",
			priority: 1000,
			addKeyboardShortcuts() {
				return {
					"Mod-Shift-x": () => this.editor.commands.toggleStrike(),
					"Mod-k": () => {
						onlink?.();
						return true;
					},
					Escape: () => {
						onexit();
						return true;
					},
					// Lists stay flat: the stored text has no nesting, so Tab does nothing.
					Tab: () => true,
				};
			},
		});

		const marksOnly = untrack(() => inline);
		const editor = new Editor({
			element: host,
			content: doc,
			extensions: [
				StarterKit.configure({
					...(marksOnly && {
						bulletList: false,
						orderedList: false,
						listItem: false,
						listKeymap: false,
					}),
					heading: false,
					blockquote: false,
					codeBlock: false,
					horizontalRule: false,
					hardBreak: false,
					underline: false,
					trailingNode: false,
					link: {
						openOnClick: false,
						autolink: false,
						HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
					},
					...(!marksOnly && {
						listKeymap: {
							listTypes: [
								{ itemName: "listItem", wrapperNames: ["bulletList", "orderedList"] },
								{ itemName: "taskItem", wrapperNames: ["taskList"] },
							],
						},
					}),
				}),
				...(marksOnly ? [] : [TaskList, TaskItem]),
				Placeholder.configure({ placeholder }),
				keys,
			],
			editorProps: {
				attributes: { class: `rich-text ${klass}`, role: "textbox", "aria-multiline": "true" },
				handleKeyDown: (_view, event) => {
					// Every key typed here is the field's. Only save leaves, so no canvas shortcut fires while typing.
					if (!((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s"))
						event.stopPropagation();
					return false;
				},
				handleDOMEvents: {
					click: (_view, event) => {
						const anchor = (event.target as HTMLElement).closest("a");
						if (anchor && (event.metaKey || event.ctrlKey))
							window.open(anchor.getAttribute("href") ?? "", "_blank", "noopener");
						return false;
					},
				},
			},
			onUpdate: ({ editor: ed, transaction }) => {
				if (transaction.docChanged) onchange(ed.getJSON());
			},
			onTransaction: () => onstate?.(),
		});

		const hit = at ? editor.view.posAtCoords({ left: at.x, top: at.y }) : null;
		if (seed) editor.chain().focus().selectAll().insertContent({ type: "text", text: seed }).run();
		else if (selectAll) editor.chain().focus().selectAll().run();
		else if (hit) editor.chain().setTextSelection(hit.pos).focus().run();
		else editor.commands.focus("end");

		onready?.({
			toggle: (command) => {
				if (
					marksOnly &&
					(command === "bulletList" || command === "orderedList" || command === "taskList")
				)
					return;
				const chain = editor.chain().focus();
				if (command === "bold") chain.toggleBold().run();
				else if (command === "italic") chain.toggleItalic().run();
				else if (command === "strike") chain.toggleStrike().run();
				else if (command === "bulletList") chain.toggleBulletList().run();
				else if (command === "orderedList") chain.toggleOrderedList().run();
				else chain.toggleList("taskList", "taskItem").run();
			},
			setLink: (href) => {
				const chain = editor.chain().focus().extendMarkRange("link");
				if (href) chain.setLink({ href }).run();
				else chain.unsetLink().run();
			},
			isActive: (name) => editor.isActive(name),
			linkHref: () => String(editor.getAttributes("link").href ?? ""),
			hasSelection: () => !editor.state.selection.empty,
			insertText: (text) => editor.chain().focus().insertContent({ type: "text", text }).run(),
			setDoc: (next) => editor.commands.setContent(next, { emitUpdate: false }),
			getDoc: () => editor.getJSON(),
			focus: () => editor.commands.focus(),
		});

		return () => editor.destroy();
	}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div bind:this={element} class="inline-editor contents"></div>

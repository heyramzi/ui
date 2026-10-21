<script lang="ts" module>
	// =========================
	// IMPORTS
	// =========================

	import { Marked } from "marked";
	import type { HTMLAttributes } from "svelte/elements";

	// =========================
	// TYPES
	// =========================

	export interface ResponseProps extends HTMLAttributes<HTMLDivElement> {
		content: string;
		/** Render a blinking caret after the content while tokens are still arriving. */
		streaming?: boolean;
		class?: string;
	}

	// =========================
	// FUNCTIONS (module scope: one shared, hardened parser)
	// =========================

	// WHY: marked does not sanitize. Rendering model/tool output with {@html} is an

	// XSS sink, so we ship a markdown-only renderer: raw HTML is escaped (never injected as elements) and link/image URLs are scheme-checked.

	// Pure JS, so it runs identically on the server and the client with no extra dependency.
	const SAFE_SCHEME = /^(?:https?:|mailto:|tel:)/i;

	function escapeHtml(value: string): string {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function safeUrl(raw: string | null | undefined): string | null {
		if (!raw) return null;
		// WHY: browsers drop tabs, newlines and control bytes from a URL, so "java\tscript:" runs as javascript:.
		const href = [...raw]
			.filter((c) => c.charCodeAt(0) > 31 && c.charCodeAt(0) !== 127)
			.join("")
			.trim();
		// Relative URLs and same-page anchors carry no scheme, so they are safe.
		if (href.startsWith("#") || href.startsWith("/") || href.startsWith(".")) return href;
		if (SAFE_SCHEME.test(href)) return href;
		if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) return href; // no scheme => relative path
		return null; // javascript:, data:, vbscript:, ...
	}

	const parser = new Marked({
		gfm: true,
		breaks: true,
		renderer: {
			html({ text }) {
				return escapeHtml(text);
			},
			link({ href, title, tokens }) {
				const safe = safeUrl(href);
				const inner = this.parser.parseInline(tokens);
				if (!safe) return inner; // strip the link, keep the visible text
				const t = title ? ` title="${escapeHtml(title)}"` : "";
				return `<a href="${escapeHtml(safe)}"${t} rel="noopener noreferrer nofollow" target="_blank">${inner}</a>`;
			},
			// WHY: an image tag fetches on render, so injected model output could leak context through its URL. A link waits for a click.
			image({ href, text }) {
				const safe = safeUrl(href);
				const label = escapeHtml(text || href || "");
				if (!safe) return label;
				return `<a href="${escapeHtml(safe)}" rel="noopener noreferrer nofollow" target="_blank">${label}</a>`;
			},
		},
	});
</script>

<script lang="ts">
	// =========================
	// IMPORTS
	// =========================

	import "#src/ai/response/Response.css";
	import { cn } from "#src/lib/utils.js";

	// =========================
	// PROPS
	// =========================

	let { content, streaming = false, class: className, ...rest }: ResponseProps = $props();

	// =========================
	// DERIVED
	// =========================

	// WHY: parse() is sync when no async extensions are registered; {async:false}
	// narrows the return type to string for the {@html} sink.
	const html = $derived(parser.parse(content ?? "", { async: false }) as string);
</script>

<!-- =========================== -->
<!-- MARKUP                      -->
<!-- =========================== -->

<div
	class={cn(
		"ai-response text-sm leading-5 [overflow-wrap:anywhere]",
		"[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
		"[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
		"[&_ul]:my-2 [&_ul]:ml-4 [&_ul]:list-disc",
		"[&_ol]:my-2 [&_ol]:ml-4 [&_ol]:list-decimal",
		"[&_li]:my-0.5",
		"[&_strong]:font-semibold",
		"[&_em]:italic",
		"[&_code]:rounded [&_code]:bg-[color:var(--muted,rgba(0,0,0,0.06))] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.875em]",
		"[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-[color:var(--muted,rgba(0,0,0,0.06))] [&_pre]:p-3",
		"[&_pre_code]:bg-transparent [&_pre_code]:p-0",
		"[&_a]:underline [&_a]:underline-offset-2",
		"[&_h1]:mt-3 [&_h1]:mb-1 [&_h1]:text-base [&_h1]:font-semibold",
		"[&_h2]:mt-3 [&_h2]:mb-1 [&_h2]:text-sm [&_h2]:font-semibold",
		"[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-medium",
		"[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
		"[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-[color:var(--border,rgba(0,0,0,0.1))] [&_blockquote]:pl-3 [&_blockquote]:text-[color:var(--muted-foreground,inherit)]",
		className,
	)}
	class:is-streaming={streaming}
	{...rest}
>
	{@html html}
</div>

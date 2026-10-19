<script lang="ts">
// =========================
// IMPORTS
// =========================
import "#src/content.css";
import { renderTiptapContent } from "#src/serializer.js";

// =========================
// TYPES
// =========================
interface Props {
	content: Record<string, unknown>;
	/** Optional URL prefix to rewrite in rendered HTML (e.g. storage CDN -> local proxy). */
	storagePrefix?: string;
	/** Replacement path for storagePrefix rewrites. */
	storageReplacement?: string;
};

// =========================
// PROPS
// =========================
let { content, storagePrefix, storageReplacement = "" }: Props = $props();

// =========================
// STATE
// =========================
let root = $state<HTMLDivElement | null>(null);

// =========================
// DERIVED
// =========================

// WHY {@html}: the serializer only reads trusted admin CMS JSON, and unlike the
// old client-only action it renders in SSR, so crawlers see the body. Issue #48.
let html = $derived.by(() => {
	if (!content) return "";
	let rendered = renderTiptapContent(content);
	if (storagePrefix && storageReplacement !== undefined) {
		rendered = rendered.replaceAll(storagePrefix, storageReplacement);
	}
	return rendered;
});

// =========================
// EFFECTS
// =========================

// WHY bound here, not onclick on the div: the facade's real <button> already
// handles Enter and Space. onclick on the div makes the compiler demand a role.
$effect(() => {
	const el = root;
	if (!el) return;
	el.addEventListener("click", handleClick);
	return () => el.removeEventListener("click", handleClick);
});

// =========================
// FUNCTIONS
// =========================

// WHY: the {@html} facade has no Svelte handlers, so this delegated listener swaps
// a clicked facade for a youtube-nocookie.com iframe: no cookies, no cost until play.
function handleClick(event: MouseEvent) {
	const target = event.target as HTMLElement | null;
	const facade = target?.closest<HTMLElement>(".tiptap-youtube");
	if (!facade) return;

	const videoId = facade.dataset.videoId;
	if (!videoId) return;
	const start = facade.dataset.start || "0";
	const title = facade.querySelector(".tiptap-youtube-title")?.textContent ?? "";

	const iframe = document.createElement("iframe");
	iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&start=${start}&rel=0`;
	iframe.title = title;
	iframe.setAttribute("frameborder", "0");
	iframe.setAttribute(
		"allow",
		"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
	);
	iframe.allowFullscreen = true;

	facade.replaceChildren(iframe);
}
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="tiptap-content" bind:this={root}>
	{@html html}
</div>

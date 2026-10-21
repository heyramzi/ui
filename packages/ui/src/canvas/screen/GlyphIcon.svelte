<script lang="ts">
// =========================
// IMPORTS
// =========================
import { GLYPHS, type GlyphName } from "#src/canvas/screen/glyphs.js";

// =========================
// TYPES
// =========================
interface Props {
	name: GlyphName;
	size?: number;
	class?: string;
}

// =========================
// PROPS
// =========================
let { name, size = 12, class: klass = "" }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span class="cv-glyph {klass}" style:--glyph={`url("${GLYPHS[name]}")`} style:--size="{size}px" aria-hidden="true"></span>

<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { NodeProps } from "@xyflow/svelte";
import ScreenBody from "#src/canvas/screen/ScreenBody.svelte";
import type { ScreenLabels } from "#src/canvas/screen/labels.js";
import { SCREEN_WIDTH } from "#src/canvas/screen/types.js";
import "#src/canvas/screen/screen.css";

// The Screen card with its own frame, for a host that has none. A host with a card frame of
// its own wraps `ScreenBody` in it instead.

// =========================
// TYPES
// =========================
interface Props extends NodeProps {
	labels?: Partial<ScreenLabels>;
}

// =========================
// PROPS
// =========================
let { id, data, selected, width, labels }: Props = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<div class="cv-frame" class:is-selected={selected} style="width:{width ?? SCREEN_WIDTH}px">
	<ScreenBody {id} {data} {labels} />
</div>

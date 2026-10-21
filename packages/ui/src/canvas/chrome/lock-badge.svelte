<script lang="ts">
// =========================
// IMPORTS
// =========================
import type { Snippet } from "svelte";

// =========================
// PROPS
// =========================
let { label, children }: { label: string; children: Snippet } = $props();
</script>

<!-- =========================== -->
<!-- MARKUP -->
<!-- =========================== -->
<span class="cv-lock-badge" data-card-locked role="img" aria-label={label}>
	{@render children()}
</span>

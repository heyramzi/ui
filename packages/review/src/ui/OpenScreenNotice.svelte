<script lang="ts">
	import { OPENSCREEN_RELEASES, OPENSCREEN_TESTED_VERSION } from "#src/core/openscreen.js";
</script>

<p class="install">
	OpenScreen isn't installed. Get version {OPENSCREEN_TESTED_VERSION} from
	<a href={OPENSCREEN_RELEASES} target="_blank" rel="noreferrer">its releases page</a> and reload this
	page.
</p>

<style>
	.install {
		color: var(--dim);
		font-size: var(--fs-xs);
	}
	.install a {
		color: var(--accent);
	}
</style>

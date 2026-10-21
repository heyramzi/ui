<script lang="ts">
// A host's text field for the PenField test: shows its value, records that it was opened.
import type { TextFieldProps } from "#src/canvas/editor/text-field-context.js";

let { value, readonly = false, class: klass = "" }: TextFieldProps = $props();
let opened = $state(0);

export function edit() {
	opened++;
}
</script>

<div data-host-field class={klass} data-readonly={readonly} data-opened={opened}>{value}</div>

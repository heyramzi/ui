<script lang="ts" module>
/** A target the data is judged against: a deal, a budget, a limit. */
export type ChartReference = {
	value: number;
	/** Already formatted, figure included: "Deal €61,500". */
	label: string;
	/** A status token when crossing it means something, e.g. `var(--destructive)`. */
	color?: string;
};
</script>

<script lang="ts">
/*
 * A dashed rule across the plot at a fixed value, labelled at its start.
 * Drawn inside a layerchart `<Svg>`; the chart widens its domain to keep it in view.
 */
import "#src/charts/reference-line.css";
import { AnnotationLine } from "layerchart";

interface Props {
	reference: ChartReference;
};

let { reference }: Props = $props();

const stroke = $derived(reference.color ?? "var(--foreground)");
</script>

<g class="hr-reference-line" style:--hr-reference-color={stroke}>
	<AnnotationLine y={reference.value} label={reference.label} labelPlacement="top-left" />
</g>

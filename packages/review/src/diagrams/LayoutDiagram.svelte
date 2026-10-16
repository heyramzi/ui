<script lang="ts">
	import { person } from "#src/diagrams/figure.js";
	import type { LayoutBox } from "#src/core/types.js";

	let { w, h, boxes, label }: { w: number; h: number; boxes: LayoutBox[]; label: string } =
		$props();

	// Ids must be unique per diagram, since a library page draws dozens of these.
	const uid = `ld${Math.random().toString(36).slice(2, 8)}`;
	const unit = $derived(Math.min(w, h));

	const corner = (box: LayoutBox) => Math.min(box.radius ?? 0, box.w / 2, box.h / 2);

	const figureOf = person;
	// The keyed cut-out is the panel's own footage, so a panel it covers shows the cut-out's person, not a second one.
	const covered = (cam: LayoutBox) =>
		cam.role === "cam" &&
		boxes.some(
			(b) =>
				b.role === "cutout" &&
				b.x <= cam.x + 1 &&
				b.y <= cam.y + 1 &&
				b.x + b.w >= cam.x + cam.w - 1 &&
				b.y + b.h >= cam.y + cam.h - 1,
		);

	/** Sample words for a text layer: a caption reads like one, a title shows its layer name. */
	const words = (box: LayoutBox) =>
		/caption/i.test(box.text ?? "") ? "Your caption" : box.text || "Title";
	const fontSize = (box: LayoutBox) =>
		Math.min(box.h * 0.62, (box.w * 0.9) / (words(box).length * 0.6));
</script>

<svg viewBox="0 0 {w} {h}" role="img" aria-label={label} preserveAspectRatio="xMidYMid meet">
	<defs>
		<linearGradient id="{uid}-room" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" class="room-top" />
			<stop offset="1" class="room-bottom" />
		</linearGradient>
		<linearGradient id="{uid}-skin" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" class="skin-top" />
			<stop offset="1" class="skin-bottom" />
		</linearGradient>
		<radialGradient id="{uid}-glow">
			<stop offset="0" class="glow-in" />
			<stop offset="1" class="glow-out" />
		</radialGradient>
		<filter id="{uid}-lift" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy={unit * 0.006} stdDeviation={unit * 0.012} flood-opacity="0.55" />
		</filter>
		<pattern id="{uid}-grid" width={unit / 9} height={unit / 9} patternUnits="userSpaceOnUse">
			<polyline points="{unit / 9},0 {unit / 9},{unit / 9} 0,{unit / 9}" class="grid-line" />
		</pattern>
		<clipPath id="{uid}-frame"><rect width={w} height={h} rx={unit * 0.03} /></clipPath>
		{#each boxes as box, i (i)}
			<clipPath id="{uid}-c{i}">
				<rect x={box.x} y={box.y} width={box.w} height={box.h} rx={corner(box)} />
			</clipPath>
		{/each}
	</defs>

	<g clip-path="url(#{uid}-frame)">
		<rect class="canvas" width={w} height={h} />
		{#each boxes as box, i (i)}
			{@const clip = `url(#${uid}-c${i})`}
			{#if box.role === "cam" || box.role === "cutout"}
				{@const p = figureOf(box)}
				<g clip-path={clip}>
					{#if box.role === "cam"}
						<rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#{uid}-room)" />
						<ellipse
							fill="url(#{uid}-glow)"
							cx={p.cx}
							cy={p.cy}
							rx={Math.max(box.w, box.h) * 0.5}
							ry={Math.max(box.w, box.h) * 0.5}
						/>
					{/if}
					{#if !covered(box)}
						<g filter={box.role === "cutout" ? `url(#${uid}-lift)` : undefined}>
							<path d={p.neck} class="neck" />
							<ellipse class="under-chin" {...p.chin} />
							<path d={p.body} class="shirt" />
							<path d={p.head} fill="url(#{uid}-skin)" />
						</g>
					{/if}
				</g>
			{:else if box.role === "screen"}
				{@const bar = Math.min(box.h * 0.09, box.w * 0.07)}
				{@const dot = bar * 0.18}
				{@const pad = Math.min(box.w, box.h) * 0.08}
				<g clip-path={clip}>
					<rect class="screen" x={box.x} y={box.y} width={box.w} height={box.h} />
					<rect class="screen-bar" x={box.x} y={box.y} width={box.w} height={bar} />
					{#each [0, 1, 2] as d (d)}
						<circle class="dot" cx={box.x + bar * 0.6 + d * dot * 3} cy={box.y + bar / 2} r={dot} />
					{/each}
					<rect
						class="pane"
						x={box.x + pad * 0.6}
						y={box.y + bar + pad * 0.6}
						width={box.w * 0.22}
						height={box.h - bar - pad * 1.2}
						rx={pad * 0.2}
					/>
					{#each [0, 1, 2, 3] as row (row)}
						<rect
							class="line"
							x={box.x + box.w * 0.22 + pad * 1.2}
							y={box.y + bar + pad * (0.9 + row * 1.1)}
							width={(box.w * 0.78 - pad * 2) * [0.8, 0.55, 0.7, 0.4][row]!}
							height={pad * 0.45}
							rx={pad * 0.22}
						/>
					{/each}
				</g>
				<rect class="edge" x={box.x} y={box.y} width={box.w} height={box.h} rx={corner(box)} />
			{:else if box.role === "media"}
				{@const s = Math.min(box.w, box.h) * 0.3}
				{@const mx = box.x + box.w / 2}
				{@const my = box.y + box.h / 2}
				<g clip-path={clip}>
					<rect class="media" x={box.x} y={box.y} width={box.w} height={box.h} />
					<polygon
						class="media-ink"
						points="{mx - s},{my + s * 0.6} {mx - s * 0.3},{my - s * 0.2} {mx + s * 0.1},{my +
							s * 0.25} {mx + s * 0.45},{my - s * 0.05} {mx + s},{my + s * 0.6}"
					/>
					<circle class="media-ink" cx={mx + s * 0.45} cy={my - s * 0.5} r={s * 0.17} />
				</g>
				<rect class="edge" x={box.x} y={box.y} width={box.w} height={box.h} rx={corner(box)} />
			{:else if box.role === "bg"}
				<rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#{uid}-grid)" />
			{:else if box.role === "text"}
				<text
					class="words"
					x={box.x + box.w / 2}
					y={box.y + box.h / 2}
					font-size={fontSize(box)}
					text-anchor="middle"
					dominant-baseline="central"
					filter="url(#{uid}-lift)">{words(box)}</text
				>
			{/if}
		{/each}
	</g>
	<rect class="frame" width={w} height={h} rx={unit * 0.03} />
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.canvas {
		fill: var(--scene-canvas);
	}
	.frame {
		fill: none;
		stroke: var(--line);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.room-top {
		stop-color: var(--scene-room-top);
	}
	.room-bottom {
		stop-color: var(--scene-room-bottom);
	}
	.glow-in {
		stop-color: var(--scene-glow);
		stop-opacity: 0.09;
	}
	.glow-out {
		stop-color: var(--scene-glow);
		stop-opacity: 0;
	}
	.skin-top {
		stop-color: var(--scene-skin-top);
	}
	.skin-bottom {
		stop-color: var(--scene-skin-bottom);
	}
	.shirt {
		fill: var(--scene-shirt);
	}
	.neck {
		fill: var(--scene-neck);
	}
	.under-chin {
		fill: var(--scene-shadow);
		opacity: 0.18;
	}
	.screen {
		fill: var(--scene-screen);
	}
	.screen-bar {
		fill: var(--scene-screen-bar);
	}
	.dot {
		fill: var(--scene-dot);
	}
	.pane {
		fill: var(--scene-pane);
	}
	.line {
		fill: var(--scene-line);
	}
	.media {
		fill: var(--scene-media);
	}
	.media-ink {
		fill: var(--scene-media-ink);
	}
	.edge {
		fill: none;
		stroke: var(--scene-edge);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.grid-line {
		fill: none;
		stroke: var(--scene-grid);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
	.words {
		fill: var(--scene-words);
		font-family: var(--sans);
		font-weight: 800;
		letter-spacing: -0.01em;
	}
</style>

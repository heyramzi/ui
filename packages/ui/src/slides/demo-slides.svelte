<script lang="ts" module>
	/** The demo's type pairing. A deck sets these two variables and every slide follows. */
	export const demoStyle =
		"--deck-font:'Schibsted Grotesk',ui-sans-serif,system-ui,sans-serif;--deck-font-display:'Bricolage Grotesque','Schibsted Grotesk',ui-sans-serif,sans-serif;";
</script>

<script lang="ts">
	import Fragment from "#src/slides/Fragment.svelte";
	import Slide from "#src/slides/Slide.svelte";

	const keys = [
		{ does: "Next", keys: ["→", "Space", "PgDn"] },
		{ does: "Back", keys: ["←", "Shift Space", "PgUp"] },
		{ does: "First or last", keys: ["Home", "End"] },
		{ does: "Overview", keys: ["O"] },
		{ does: "Fullscreen", keys: ["F"] },
		{ does: "Presenter", keys: ["P"] },
	];
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		rel="stylesheet"
		href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Schibsted+Grotesk:wght@400;500;600&display=swap"
	/>
</svelte:head>

<Slide
	align="bare"
	label="Cover"
	notes="Open with the promise: design once at 960 by 540 and it fits anything. Resize the window while you say it, the slide keeps its shape."
>
	<div class="cover">
		<div class="cover__text">
			<p class="deck-label">@heyramzi/ui/slides</p>
			<h1 class="deck-display">One canvas, any screen.</h1>
			<p class="deck-lead">
				Design in 960 by 540 pixels. The deck scales to fit a phone, a laptop or a projector.
			</p>
		</div>
		<svg
			class="cover__fit"
			viewBox="0 0 280 204"
			role="img"
			aria-label="The same slide fitted into a phone, a wide window and a screen"
		>
			<rect x="6" y="6" width="96" height="190" rx="14" class="frame" />
			<rect x="12" y="75" width="84" height="47.25" rx="3" class="slide-shape" />
			<rect x="126" y="6" width="148" height="83.25" rx="8" class="frame" />
			<rect x="131" y="11" width="138" height="73.25" rx="3" class="slide-shape" />
			<rect x="126" y="126" width="148" height="70" rx="8" class="frame" />
			<rect x="151.6" y="131" width="96.8" height="60" rx="3" class="slide-shape" />
		</svg>
		<p class="deck-caption cover__hint">Right arrow or space to go on.</p>
	</div>
</Slide>

<Slide
	align="bare"
	label="Reveals"
	notes="Press the arrow slowly and let each row land. The last step has two rows, so you can see them arrive one after the other."
>
	<div class="split split--rows">
		<div class="split__head">
			<p class="deck-label">Reveals</p>
			<h2 class="deck-title">Press once and one thing appears.</h2>
		</div>
		<ol class="rows">
			<Fragment as="li" step={1} class="row">
				<h3 class="deck-heading">Walk it by hand</h3>
				<p class="deck-body">An arrow press shows one step. After the last, the next slide.</p>
			</Fragment>
			<Fragment as="li" step={2} class="row">
				<h3 class="deck-heading">Back undoes a step</h3>
				<p class="deck-body">Going back lands on the earlier slide fully shown.</p>
			</Fragment>
			<Fragment as="li" step={3} class="row">
				<h3 class="deck-heading">Shared steps stagger</h3>
				<p class="deck-body">Rows that share a step arrive one after another.</p>
			</Fragment>
			<Fragment as="li" step={3} class="row">
				<h3 class="deck-heading">Print shows them all</h3>
				<p class="deck-body">A PDF has no keyboard. It shows every step.</p>
			</Fragment>
		</ol>
	</div>
</Slide>

<Slide
	align="bare"
	label="Keys"
	notes="Press O now. The slides zoom out into a grid and you can click one to jump. Escape or O brings you back."
>
	<div class="split">
		<div class="split__head">
			<p class="deck-label">Keys</p>
			<h2 class="deck-title">Press <kbd class="key key--big">O</kbd> to see the whole deck.</h2>
			<p class="deck-body">Click a slide to jump to it. Escape closes the grid.</p>
		</div>
		<dl class="keys">
			{#each keys as row (row.does)}
				<div class="keys__row">
					<dt class="deck-body">{row.does}</dt>
					<dd>
						{#each row.keys as key (key)}<kbd class="key">{key}</kbd>{/each}
					</dd>
				</div>
			{/each}
		</dl>
	</div>
</Slide>

<Slide
	align="bare"
	label="Themes"
	notes="Switch the theme from the toolbar above the deck while this slide is up. Nothing else changes, because every colour is a variable."
>
	<div class="split">
		<div class="split__head">
			<p class="deck-label">Themes</p>
			<h2 class="deck-title">Retheme with variables.</h2>
			<p class="deck-body">
				Ink, paper or the system setting. The package brings no brand of its own.
			</p>
		</div>
		<div class="theme">
			<pre class="code"><code
					>.deck &#123;
  --deck-accent: #ff4d8d;
  --deck-font-display: 'Space Grotesk';
  --deck-pad: 72px;
&#125;</code
				></pre>
			<div class="swatch" role="img" aria-label="Ground, text and accent in proportion">
				<span class="swatch__ground">Ground</span>
				<span class="swatch__text">Text</span>
				<span class="swatch__accent"></span>
			</div>
		</div>
	</div>
</Slide>

<Slide
	align="bare"
	label="Data"
	notes="This is the mode the apps use: slides are JSON, and a registry says how each type draws itself. Validation is optional and brings no dependency."
>
	<div class="split">
		<div class="split__head">
			<p class="deck-label">Data</p>
			<h2 class="deck-title">Or write the deck as data.</h2>
			<p class="deck-body">
				A registry maps each slide type to a layout. Bring your own schema if you want one.
			</p>
		</div>
		<div class="theme">
			<pre class="code"><code
					>const cover = defineSlideType(&#123;
  type: 'cover',
  label: 'Cover',
  layout: CoverLayout,
&#125;);

&lt;Deck &#123;...deck&#125; &#123;registry&#125; /&gt;</code
				></pre>
			<pre class="code"><code
					>&#123; "id": "q3", "title": "Q3 review",
  "canvas": &#123; "w": 960, "h": 540 &#125;,
  "slides": [&#123; "id": "a", "type": "cover",
    "content": &#123; "title": "Q3" &#125; &#125;] &#125;</code
				></pre>
		</div>
	</div>
</Slide>

<Slide
	align="bare"
	label="Presenter"
	notes="Open the presenter view from the toolbar. Move on here and watch the other window follow. Then print the page: one canvas per page, every step shown."
>
	<div class="close">
		<p class="deck-label">Presenter view and print</p>
		<h2 class="deck-title">Notes in one window, the audience in another.</h2>
		<p class="deck-lead">
			Both windows follow the same slide. Print the page and every canvas gets its own page, steps
			shown.
		</p>
	</div>
</Slide>

<style>
	.cover,
	.split,
	.close {
		position: relative;
		box-sizing: border-box;
		height: 100%;
		padding: var(--deck-pad);
	}

	/* Cover: copy on the left, the fit diagram on the right. */
	.cover {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
		gap: 48px;
		align-items: center;
	}
	.cover__text {
		display: grid;
		gap: 22px;
		justify-items: start;
	}
	.cover__text .deck-display {
		max-width: 9ch;
	}
	.cover__text .deck-lead {
		max-width: 24em;
	}
	.cover__fit {
		width: 100%;
		max-height: 100%;
		overflow: visible;
	}
	.frame {
		fill: var(--deck-surface);
		stroke: var(--deck-line);
		stroke-width: 1.5;
	}
	.slide-shape {
		fill: var(--deck-accent);
	}
	.cover__hint {
		position: absolute;
		bottom: 40px;
		left: var(--deck-pad);
	}

	/* Split: a heading column and a content column. */
	.split {
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
		gap: 56px;
		align-items: center;
	}
	.split--rows {
		grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
	}
	.split__head {
		display: grid;
		gap: 18px;
		justify-items: start;
	}
	.split__head .deck-title {
		max-width: 11ch;
	}
	.split__head .deck-body {
		max-width: 22em;
	}

	.rows {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.rows :global(.row) {
		display: grid;
		gap: 4px;
		padding: 15px 0;
		border-top: 1px solid var(--deck-line);
	}
	.rows :global(.deck-heading) {
		font-size: 23px;
	}
	.rows :global(.deck-body) {
		font-size: 16px;
	}
	.rows :global(.row:last-child) {
		border-bottom: 1px solid var(--deck-line);
	}

	.keys {
		margin: 0;
		border-top: 1px solid var(--deck-line);
	}
	.keys__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid var(--deck-line);
	}
	.keys dd {
		display: flex;
		gap: 6px;
		margin: 0;
	}
	.key {
		display: inline-grid;
		place-items: center;
		min-width: 30px;
		height: 28px;
		padding: 0 9px;
		font: 600 13px/1 var(--deck-font);
		color: var(--deck-fg);
		background: var(--deck-surface);
		border: 1px solid var(--deck-line);
		border-bottom-width: 2px;
		border-radius: 7px;
	}
	.key--big {
		min-width: 0;
		height: 1.05em;
		padding: 0 0.28em;
		margin: 0 0.08em;
		font: inherit;
		font-size: 0.85em;
		color: var(--deck-on-accent);
		background: var(--deck-accent);
		border-color: var(--deck-accent);
		vertical-align: 0.04em;
	}

	.theme {
		display: grid;
		gap: 16px;
	}
	.code {
		margin: 0;
		padding: 20px 22px;
		overflow: hidden;
		font:
			500 14px/1.6 ui-monospace,
			"SF Mono",
			Menlo,
			monospace;
		color: var(--deck-fg);
		background: var(--deck-surface);
		border: 1px solid var(--deck-line);
		border-radius: 12px;
	}
	.swatch {
		display: grid;
		grid-template-columns: 6fr 3fr 1fr;
		height: 76px;
		overflow: hidden;
		font: 600 13px/1 var(--deck-font);
		border: 1px solid var(--deck-line);
		border-radius: 12px;
	}
	.swatch span {
		display: flex;
		align-items: flex-end;
		padding: 12px 14px;
	}
	.swatch__ground {
		background: var(--deck-bg);
		color: var(--deck-muted);
	}
	.swatch__text {
		background: var(--deck-fg);
		color: var(--deck-bg);
	}
	.swatch__accent {
		background: var(--deck-accent);
	}

	.close {
		display: grid;
		align-content: center;
		justify-items: start;
		gap: 22px;
	}
	.close .deck-title {
		max-width: 14em;
		font-size: 60px;
	}
	.close .deck-lead {
		max-width: 26em;
	}
</style>

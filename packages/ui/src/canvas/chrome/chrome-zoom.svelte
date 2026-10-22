<script lang="ts">
	// =========================
	// IMPORTS
	// =========================
	import { useConnection, useStore } from "@xyflow/svelte";
	import { untrack } from "svelte";

	// A root `--canvas-unzoom` restyled every card per zoom frame. It lives only on nodes showing chrome: selected, hovered, or all while a link is dragged.

	// =========================
	// CONSTANTS
	// =========================
	const MIN_ZOOM = 0.05;
	const NODE = ".svelte-flow__node";

	// =========================
	// STATE
	// =========================
	const store = useStore();
	const connection = useConnection();

	// Plain collections: they change on selection and hover, never per frame, and nothing reads them reactively.
	const selected = new Set<HTMLElement>();
	let hovered: HTMLElement | null = null;

	// =========================
	// DERIVED
	// =========================
	let unzoom = $derived(String(1 / Math.max(store.viewport.zoom, MIN_ZOOM)));
	let linking = $derived(connection.current.inProgress);

	// =========================
	// FUNCTIONS
	// =========================
	const paint = (node: HTMLElement | null, value = unzoom) =>
		node?.style.setProperty("--canvas-unzoom", value);

	function paintShowing(value: string) {
		for (const node of selected) {
			if (node.isConnected) paint(node, value);
			else selected.delete(node);
		}
		paint(hovered, value);
	}

	// Chrome that belongs to one card (grips, quick-add) hides while several are selected: see chrome.css.
	function flagMulti() {
		store.domNode?.toggleAttribute("data-cv-multi", selected.size > 1);
	}

	function track(node: HTMLElement) {
		if (node.classList.contains("selected")) {
			if (!selected.has(node)) {
				selected.add(node);
				paint(node);
			}
		} else selected.delete(node);
		flagMulti();
	}

	// =========================
	// EFFECTS
	// =========================
	$effect(() => {
		paintShowing(unzoom);
	});

	$effect(() => {
		const root = store.domNode;
		if (!root) return;
		if (linking) {
			root.dataset.cvLinking = "";
			const value = unzoom;
			for (const node of root.querySelectorAll<HTMLElement>(NODE)) paint(node, value);
			return () => delete root.dataset.cvLinking;
		}
	});

	function watch(root: HTMLElement) {
		const over = (event: PointerEvent) => {
			const node = (event.target as Element | null)?.closest<HTMLElement>(NODE) ?? null;
			if (node === hovered) return;
			hovered = node;
			paint(node);
		};
		root.addEventListener("pointerover", over, { passive: true });

		// A node picks up or loses the `selected` class when the selection changes, and arrives selected when pasted or created.
		for (const node of root.querySelectorAll<HTMLElement>(`${NODE}.selected`)) track(node);
		const classes = new MutationObserver((records) => {
			for (const record of records) {
				const node = record.target as HTMLElement;
				if (node.matches(NODE)) track(node);
			}
		});
		classes.observe(root, { attributes: true, attributeFilter: ["class"], subtree: true });
		const arrivals = new MutationObserver((records) => {
			for (const record of records) {
				for (const added of record.addedNodes) {
					if (added instanceof HTMLElement && added.matches(NODE)) track(added);
				}
			}
		});
		const layer = root.querySelector(".svelte-flow__nodes");
		if (layer) arrivals.observe(layer, { childList: true });

		return () => {
			root.removeEventListener("pointerover", over);
			classes.disconnect();
			arrivals.disconnect();
			selected.clear();
			root.removeAttribute("data-cv-multi");
		};
	}

	$effect(() => {
		const root = store.domNode;
		if (!root) return;
		return untrack(() => watch(root));
	});
</script>

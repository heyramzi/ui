### Changes

* The canvas needs `@xyflow/svelte` 2: the peer range is now `^2.0.1`. Move the host to `@xyflow/svelte@^2.0.1` in the same change as this release, or pnpm reports an unmet peer and the board runs two copies of xyflow.
* xyflow 2 renamed `useStore` to `useSvelteFlowStore`, dropped the setters on `useNodes` and `useEdges` (call `updateNode` or `updateEdge` from `useSvelteFlow`), and reads a number in `fitViewOptions.padding` as pixels: pass a percentage string such as `'10%'` where a host passed `0.2`. The xyflow 2.0.0 changelog lists the rest.
* xyflow 2 gives the board `color-scheme: light dark`, so a light page on a dark system drew a dark board. `canvas-ui.css` now sets the board's scheme from the page's `.dark` class, unless the host passes `forceColorMode`.

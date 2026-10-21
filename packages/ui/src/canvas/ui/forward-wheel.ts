// An overlay above xyflow's zoom pane never sees a wheel or a pinch, so it hands them down.

export function forwardWheel(node: HTMLElement): () => void {
  const handler = (event: WheelEvent) => {
    const zoomPane = node.closest(".svelte-flow")?.querySelector(".svelte-flow__zoom");
    if (!zoomPane) return;
    event.preventDefault();
    zoomPane.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ,
        deltaMode: event.deltaMode,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey,
        bubbles: true,
        cancelable: true,
      }),
    );
  };
  node.addEventListener("wheel", handler, { passive: false });
  return () => node.removeEventListener("wheel", handler);
}

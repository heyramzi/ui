import type { Node } from "@xyflow/svelte";

export type Rect = { x: number; y: number; width: number; height: number };
export type TableCellHit = { row: number; col: number };

export type ContextMenuHit =
  | { kind: "edge"; edgeId: string; position: { x: number; y: number } }
  | {
      kind: "canvas";
      position: { x: number; y: number };
      anchorRect: Rect | null;
      nodeId: string | null;
      nodeType: string | null;
      tableCell: TableCellHit | null;
    };

function rectOf(el: Element | null): Rect | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}

function tableCellOf(target: HTMLElement): TableCellHit | null {
  const cell = target.closest<HTMLElement>("[data-table-row]");
  if (!cell) return null;
  return { row: Number(cell.dataset.tableRow), col: Number(cell.dataset.tableCol) };
}

/** Reads a right-click into an edge hit, or a canvas/node hit with its anchor
 *  rect and cell. The edge check runs first, because an arrow also carries
 *  `data-id`. */
export function resolveContextMenuHit(event: MouseEvent, nodes: Node[]): ContextMenuHit {
  const target = event.target as HTMLElement;
  const position = { x: event.clientX, y: event.clientY };
  const edgeId = target.closest(".svelte-flow__edge")?.getAttribute("data-id");
  if (edgeId) return { kind: "edge", edgeId, position };
  const nodeElement = target.closest("[data-id]");
  const nodeId = nodeElement?.getAttribute("data-id") ?? null;
  const node = nodeId ? nodes.find((n) => n.id === nodeId) : undefined;
  return {
    kind: "canvas",
    position,
    anchorRect: rectOf(nodeElement),
    nodeId,
    nodeType: node?.type ?? null,
    tableCell: tableCellOf(target),
  };
}

import { describe, expect, it } from "vite-plus/test";
import { sortParentsFirst, stripCallbacks } from "#src/canvas/headless/canvas-cleanup.js";
import { makeNode } from "#src/canvas/test-utils.js";
import type { CanvasNode } from "#src/canvas/types.js";

/** Read serialized data as a loose record: these tests exercise old fields
 * that are no longer part of any per-type shape but must survive the denylist. */
function loose(node: { data: unknown }): Record<string, unknown> {
  return node.data as Record<string, unknown>;
}

function makeImageNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return makeNode({
    id: "img-1",
    type: "image",
    position: { x: 100, y: 200 },
    data: {
      label: "Image",
      nodeType: "image",
      imageUrl: "https://storage.example.com/diagram-images/abc123.avif",
      imageWidth: 800,
      imageHeight: 600,
      // Callback that should be stripped
      onDelete: () => {},
    } as Record<string, unknown> & { onDelete: () => void },
    ...overrides,
  });
}

describe("stripCallbacks", () => {
  it("preserves data fields it has never heard of (no silent allowlist loss)", () => {
    const nodes = [
      makeImageNode({
        data: {
          label: "Image",
          nodeType: "image",
          someFutureField: { nested: true },
          anotherNewFlag: "keep-me",
        } as Record<string, unknown> & Record<string, unknown>,
      }),
    ];
    const result = stripCallbacks(nodes);
    expect((result[0].data as Record<string, unknown>).someFutureField).toEqual({ nested: true });
    expect((result[0].data as Record<string, unknown>).anotherNewFlag).toBe("keep-me");
  });

  it("preserves labelFr for bilingual nodes", () => {
    const nodes: CanvasNode[] = [
      {
        id: "n-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {
          label: "Delivery PM Agent",
          labelFr: "Agent PM Livraison",
          nodeType: "agent",
          descriptionFr: "Description en français",
        } satisfies Record<string, unknown>,
      },
    ];
    const result = stripCallbacks(nodes);

    expect(result[0].data.label).toBe("Delivery PM Agent");
    expect(result[0].data.labelFr).toBe("Agent PM Livraison");
    expect(result[0].data.descriptionFr).toBe("Description en français");
  });

  it("preserves editable node-specific fields during autosave serialization", () => {
    const nodes: CanvasNode[] = [
      {
        id: "space-1",
        type: "space",
        position: { x: 0, y: 0 },
        data: {
          label: "Delivery",
          nodeType: "space",
          spaceChildren: [
            {
              id: "list-1",
              type: "list",
              label: "Implementation",
              statuses: [{ name: "In progress", color: "blue" }],
            },
          ],
        } as Record<string, unknown>,
      },
      {
        id: "pw-1",
        type: "pains-wishes",
        position: { x: 100, y: 0 },
        data: {
          label: "Customer fit",
          nodeType: "pains-wishes",
          pains: [{ id: "pain-1", text: "Manual reporting" }],
          wishes: [{ id: "wish-1", text: "Faster onboarding" }],
        },
      },
      {
        id: "mindmap-1",
        type: "mindmap",
        position: { x: 200, y: 0 },
        data: {
          label: "Launch plan",
          nodeType: "mindmap",
          leftChildCount: 2,
          rightChildCount: 3,
          note: "Needs owner",
          status: "doing",
          url: "https://example.com/brief",
          expanded: false,
        } as Record<string, unknown>,
      },
    ];

    const result = stripCallbacks(nodes);

    expect(loose(result[0]).spaceChildren).toEqual(loose(nodes[0]).spaceChildren);
    expect(loose(result[1]).pains).toEqual(loose(nodes[1]).pains);
    expect(loose(result[1]).wishes).toEqual(loose(nodes[1]).wishes);
    // Derived mindmap counts are runtime-only and must NOT persist.
    expect(result[2].data).not.toHaveProperty("leftChildCount");
    expect(result[2].data).not.toHaveProperty("rightChildCount");
    expect(loose(result[2]).note).toBe("Needs owner");
    expect(loose(result[2]).status).toBe("doing");
    expect(loose(result[2]).url).toBe("https://example.com/brief");
    expect(loose(result[2]).expanded).toBe(false);
  });

  it("image node survives full round-trip (create -> serialize -> deserialize)", () => {
    const imageNode: CanvasNode = {
      id: "img-rt",
      type: "image",
      position: { x: 50, y: 100 },
      style: { width: 400, height: 300 },
      data: {
        label: "Image",
        nodeType: "image",
        imageUrl: "https://storage.example.com/diagram-images/hash123.avif",
        imageWidth: 1200,
        imageHeight: 900,
        onDelete: () => {},
        locale: "en",
      } as Record<string, unknown> & { onDelete: () => void; locale: string },
    };

    // Serialize (what happens on save / after move)
    const serialized = stripCallbacks([imageNode]);

    // Verify all critical fields survived
    expect(serialized[0].type).toBe("image");
    expect(loose(serialized[0]).imageUrl).toBe(
      "https://storage.example.com/diagram-images/hash123.avif",
    );
    expect(loose(serialized[0]).imageWidth).toBe(1200);
    expect(loose(serialized[0]).imageHeight).toBe(900);
    expect(serialized[0].style).toEqual({ width: 400, height: 300 });
    // Runtime-only fields must be gone
    expect(serialized[0].data).not.toHaveProperty("onDelete");
    expect(serialized[0].data).not.toHaveProperty("locale");
  });
});

describe("sortParentsFirst", () => {
  // Array order is paint order, so a reshuffle sends ink behind the card it was drawn over.
  it("keeps roots in their saved order and puts each child after its parent", () => {
    const nodes = [
      { id: "table" },
      { id: "frame" },
      { id: "card", parentId: "frame" },
      { id: "stroke" },
      { id: "note", parentId: "frame" },
    ];
    expect(sortParentsFirst(nodes).map((n) => n.id)).toEqual([
      "table",
      "frame",
      "card",
      "note",
      "stroke",
    ]);
  });
});

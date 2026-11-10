import { afterEach, describe, expect, it } from "vite-plus/test";
import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { TextSelection } from "@tiptap/pm/state";
import { moveBlock } from "#src/editor/block-move.js";

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

function make(html: string) {
  editor = new Editor({ extensions: [StarterKit], content: html });
  return editor;
}

const texts = (e: Editor) => e.state.doc.content.content.map((n) => n.textContent);

/** Puts the cursor `offset` characters into top-level block `index`. */
function cursorIn(e: Editor, index: number, offset: number) {
  let pos = 0;
  for (let i = 0; i < index; i++) pos += e.state.doc.child(i).nodeSize;
  e.view.dispatch(e.state.tr.setSelection(TextSelection.create(e.state.doc, pos + 1 + offset)));
}

describe("moveBlock", () => {
  it("swaps the cursor's block with the one below and keeps the cursor in it", () => {
    const e = make("<p>alpha</p><p>beta</p><p>gamma</p>");
    cursorIn(e, 0, 2);
    const tr = moveBlock(e.state, 1);
    if (!tr) throw new Error("expected a move");
    e.view.dispatch(tr);
    expect(texts(e)).toEqual(["beta", "alpha", "gamma"]);
    expect(e.state.selection.$from.parent.textContent).toBe("alpha");
    expect(e.state.selection.$from.parentOffset).toBe(2);
  });

  it("moves a whole list up as one block", () => {
    const e = make("<p>intro</p><ul><li><p>one</p></li><li><p>two</p></li></ul>");
    cursorIn(e, 1, 3);
    const tr = moveBlock(e.state, -1);
    if (!tr) throw new Error("expected a move");
    e.view.dispatch(tr);
    expect(e.state.doc.child(0).type.name).toBe("bulletList");
    // StarterKit keeps an empty paragraph after a closing list, so only the first two are ours.
    expect(texts(e).slice(0, 2)).toEqual(["onetwo", "intro"]);
  });

  it("does nothing at the top or bottom", () => {
    const e = make("<p>alpha</p><p>beta</p>");
    cursorIn(e, 0, 0);
    expect(moveBlock(e.state, -1)).toBeNull();
    cursorIn(e, 1, 0);
    expect(moveBlock(e.state, 1)).toBeNull();
  });
});

import { afterEach, describe, expect, it } from "vite-plus/test";
import { Editor } from "@tiptap/core";
import { buildExtensions } from "#src/editor/extensions.js";

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe("image alignment", () => {
  it("keeps the align the image toolbar sets, as data-align", () => {
    editor = new Editor({
      extensions: buildExtensions({ preset: "full", placeholder: "", blockIds: false }),
      content: '<p>a</p><img src="x.png">',
    });
    const pos = editor.state.doc.child(0).nodeSize;
    const image = editor.state.doc.nodeAt(pos);
    if (!image) throw new Error("no image");
    editor.view.dispatch(
      editor.state.tr.setNodeMarkup(pos, undefined, { ...image.attrs, align: "center" }),
    );
    expect(editor.state.doc.nodeAt(pos)?.attrs.align).toBe("center");
    expect(editor.getHTML()).toContain('data-align="center"');
  });

  it("reads data-align back from HTML", () => {
    editor = new Editor({
      extensions: buildExtensions({ preset: "full", placeholder: "", blockIds: false }),
      content: '<img src="x.png" data-align="right">',
    });
    expect(editor.state.doc.child(0).attrs.align).toBe("right");
  });
});

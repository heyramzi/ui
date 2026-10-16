import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { copyRichText, copyText } from "#src/components/copy/clipboard.js";

// Mock navigator.clipboard
const mockClipboard = {
  write: vi.fn(),
  writeText: vi.fn(),
};

// Mock ClipboardItem
const mockClipboardItem = vi.fn();

describe("clipboard", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { clipboard: mockClipboard });
    vi.stubGlobal("ClipboardItem", mockClipboardItem);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("copyRichText", () => {
    it("copies HTML with modern Clipboard API", async () => {
      mockClipboard.write.mockResolvedValue(undefined);

      const result = await copyRichText("<p>Hello <strong>World</strong></p>", "Hello World");

      expect(result).toBe(true);
      expect(mockClipboardItem).toHaveBeenCalledWith({
        "text/html": expect.any(Blob),
        "text/plain": expect.any(Blob),
      });
      expect(mockClipboard.write).toHaveBeenCalledTimes(1);
    });

    it("extracts plain text from HTML when not provided", async () => {
      mockClipboard.write.mockResolvedValue(undefined);

      await copyRichText("<p>Test</p>");

      // Verify ClipboardItem was called with both HTML and plain text blobs
      expect(mockClipboardItem).toHaveBeenCalled();
    });

    it("falls back to plain text when Clipboard API fails", async () => {
      mockClipboard.write.mockRejectedValue(new Error("Not supported"));
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyRichText("<p>Test</p>", "Test");

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("Test");
    });

    it("returns false when both methods fail", async () => {
      mockClipboard.write.mockRejectedValue(new Error("Not supported"));
      mockClipboard.writeText.mockRejectedValue(new Error("Blocked"));

      const result = await copyRichText("<p>Test</p>", "Test");

      expect(result).toBe(false);
    });

    it("creates correct blob types", async () => {
      mockClipboard.write.mockResolvedValue(undefined);

      await copyRichText("<b>Bold</b>", "Bold");

      const clipboardItemCall = mockClipboardItem.mock.calls[0][0];

      expect(clipboardItemCall["text/html"]).toBeInstanceOf(Blob);
      expect(clipboardItemCall["text/html"].type).toBe("text/html");
      expect(clipboardItemCall["text/plain"]).toBeInstanceOf(Blob);
      expect(clipboardItemCall["text/plain"].type).toBe("text/plain");
    });
  });

  describe("copyText", () => {
    it("copies text successfully", async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyText("Hello World");

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("Hello World");
    });

    it("returns false on failure", async () => {
      mockClipboard.writeText.mockRejectedValue(new Error("Permission denied"));

      const result = await copyText("Test");

      expect(result).toBe(false);
    });

    it("handles empty string", async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyText("");

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("");
    });

    it("handles special characters", async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);

      const result = await copyText("Hello <>&\"' World");

      expect(result).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith("Hello <>&\"' World");
    });
  });
});

// Test htmlToPlainText server-side conversion (via copyRichText behavior)
describe("htmlToPlainText (server-side)", () => {
  beforeEach(() => {
    // Remove document to simulate server environment
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error("Server")),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    vi.stubGlobal("ClipboardItem", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converts line breaks", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error()),
        writeText: mockWriteText,
      },
    });

    await copyRichText("Line 1<br>Line 2<br/>Line 3");

    expect(mockWriteText).toHaveBeenCalledWith("Line 1\nLine 2\nLine 3");
  });

  it("converts paragraph tags", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error()),
        writeText: mockWriteText,
      },
    });

    await copyRichText("<p>Para 1</p><p>Para 2</p>");

    expect(mockWriteText).toHaveBeenCalledWith("Para 1\n\nPara 2");
  });

  it("converts list items to bullets", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error()),
        writeText: mockWriteText,
      },
    });

    await copyRichText("<ul><li>Item 1</li><li>Item 2</li></ul>");

    expect(mockWriteText).toHaveBeenCalledWith("• Item 1\n• Item 2");
  });

  it("strips remaining HTML tags", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error()),
        writeText: mockWriteText,
      },
    });

    await copyRichText("<div><span>Hello</span> <strong>World</strong></div>");

    expect(mockWriteText).toHaveBeenCalledWith("Hello World");
  });

  it("decodes HTML entities", async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error()),
        writeText: mockWriteText,
      },
    });

    // The function decodes &nbsp; to space, &amp; to &, &lt; to <, &gt; to >
    await copyRichText("Hello&nbsp;World &amp; Friends &lt;3&gt;");

    expect(mockWriteText).toHaveBeenCalledWith("Hello World & Friends <3>");
  });
});

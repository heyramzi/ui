import { describe, expect, it } from "vite-plus/test";
import {
  checkFiles,
  describeAccept,
  describeLimits,
  fileKind,
  formatSize,
  matchesAccept,
  removeFile,
} from "#src/components/file-drop-zone/files.js";

const file = (name: string, type: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type, lastModified: 1 });

describe("matchesAccept", () => {
  it("takes extensions, exact types and groups, in any case", () => {
    expect(matchesAccept(file("Bail.PDF", ""), ".pdf")).toBe(true);
    expect(matchesAccept(file("a.bin", "application/pdf"), "application/pdf")).toBe(true);
    expect(matchesAccept(file("photo.heic", "image/heic"), "image/*")).toBe(true);
    expect(matchesAccept(file("releve.csv", "text/csv"), ".pdf,image/*")).toBe(false);
  });

  it("lets everything through without an accept string", () => {
    expect(matchesAccept(file("x.zip", "application/zip"), undefined)).toBe(true);
    expect(matchesAccept(file("x.zip", "application/zip"), " ")).toBe(true);
  });
});

describe("checkFiles", () => {
  it("turns away the wrong type before the size", () => {
    const big = file("gros.csv", "text/csv", 5000);
    const result = checkFiles([big], [], { accept: ".pdf", maxFileSize: 100 });
    expect(result.rejected).toEqual([{ file: big, reason: "type" }]);
  });

  it("turns away a file over the size limit", () => {
    const big = file("gros.pdf", "application/pdf", 5000);
    const small = file("petit.pdf", "application/pdf", 50);
    const result = checkFiles([big, small], [], {
      accept: ".pdf",
      maxFileSize: 100,
      multiple: true,
    });
    expect(result.files).toEqual([small]);
    expect(result.rejected).toEqual([{ file: big, reason: "size" }]);
  });

  it("stops at maxFiles, counting what's already there", () => {
    const a = file("a.pdf", "application/pdf");
    const b = file("b.pdf", "application/pdf");
    const c = file("c.pdf", "application/pdf");
    const result = checkFiles([b, c], [a], { multiple: true, maxFiles: 2 });
    expect(result.files).toEqual([a, b]);
    expect(result.accepted).toEqual([b]);
    expect(result.rejected).toEqual([{ file: c, reason: "count" }]);
  });

  it("replaces the one file without multiple, and keeps it when the new one is refused", () => {
    const a = file("a.pdf", "application/pdf");
    const b = file("b.pdf", "application/pdf");
    expect(checkFiles([b], [a], { accept: ".pdf" }).files).toEqual([b]);
    expect(checkFiles([file("x.png", "image/png")], [a], { accept: ".pdf" }).files).toEqual([a]);
  });

  it("ignores the same file picked twice", () => {
    const a = file("a.pdf", "application/pdf");
    const again = file("a.pdf", "application/pdf");
    const result = checkFiles([again], [a], { multiple: true });
    expect(result.files).toEqual([a]);
    expect(result.rejected).toEqual([]);
  });
});

describe("removeFile", () => {
  it("drops that one file and keeps the order", () => {
    const a = file("a.pdf", "application/pdf");
    const b = file("b.pdf", "application/pdf");
    const c = file("c.pdf", "application/pdf");
    expect(removeFile([a, b, c], b)).toEqual([a, c]);
  });
});

describe("words", () => {
  it("writes sizes the French way", () => {
    expect(formatSize(820)).toBe("820 o");
    expect(formatSize(12 * 1024)).toBe("12 Ko");
    expect(formatSize(1.4 * 1024 * 1024)).toBe("1,4 Mo");
    expect(formatSize(10 * 1024 * 1024)).toBe("10 Mo");
  });

  it("names the accepted types once each", () => {
    expect(describeAccept(".pdf,application/pdf")).toBe("PDF");
    expect(describeAccept("image/*,.csv")).toBe("Images, CSV");
    expect(describeLimits(".pdf", 10 * 1024 * 1024)).toBe("PDF, 10 Mo maximum");
    expect(describeLimits(undefined, undefined)).toBe("");
  });

  it("picks an icon kind from the type or the name", () => {
    expect(fileKind(file("a.pdf", ""))).toBe("pdf");
    expect(fileKind(file("a.jpg", "image/jpeg"))).toBe("image");
    expect(fileKind(file("a.csv", ""))).toBe("csv");
    expect(fileKind(file("a.xlsx", ""))).toBe("sheet");
    expect(fileKind(file("a.txt", "text/plain"))).toBe("other");
  });
});

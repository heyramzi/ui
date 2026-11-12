import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { flushSync, mount, unmount } from "svelte";
import FileDropZone from "#src/components/file-drop-zone/file-drop-zone.svelte";

// jsdom has no DataTransfer and its input.files takes only a FileList, so the stub returns an
// array and each input records what the zone wrote.
class DataTransferStub {
  readonly list: File[] = [];
  readonly items = { add: (file: File) => this.list.push(file) };
  get files() {
    return this.list;
  }
}

beforeEach(() => {
  (globalThis as { DataTransfer?: unknown }).DataTransfer = DataTransferStub;
});

afterEach(() => {
  delete (globalThis as { DataTransfer?: unknown }).DataTransfer;
  document.body.innerHTML = "";
});

const pdf = (name: string, size = 10) =>
  new File([new Uint8Array(size)], name, { type: "application/pdf", lastModified: 1 });

function render(props: Record<string, unknown> = {}) {
  const target = document.createElement("div");
  document.body.appendChild(target);
  const app = mount(FileDropZone, { target, props: { name: "justificatif", ...props } });
  flushSync();
  const input = target.querySelector<HTMLInputElement>("input[type=file]");
  if (!input) throw new Error("no file input");
  let written: File[] = [];
  Object.defineProperty(input, "files", {
    configurable: true,
    get: () => written,
    set: (value: File[]) => {
      written = [...value];
    },
  });
  const fire = (type: string, files: File[]) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { types: ["Files"], files, dropEffect: "none" },
    });
    target.querySelector("[data-slot=file-drop-zone-target]")?.dispatchEvent(event);
    flushSync();
  };
  const drop = (files: File[]) => {
    fire("dragenter", files);
    fire("drop", files);
  };
  const names = () =>
    [...target.querySelectorAll("[data-file-name]")].map((row) =>
      row.getAttribute("data-file-name"),
    );
  return {
    target,
    input,
    drop,
    fire,
    names,
    written: () => written.map((file) => file.name),
    done: () => void unmount(app),
  };
}

describe("FileDropZone", () => {
  it("speaks French with no setup", () => {
    const { target, done } = render({ accept: ".pdf", maxFileSize: 10 * 1024 * 1024 });
    const text = target.textContent ?? "";
    expect(text).toContain("Glissez votre fichier ici");
    expect(text).toContain("ou cliquez pour le choisir");
    expect(text).toContain("PDF, 10 Mo maximum");
    done();
  });

  it("writes dropped files into the real input, so a form post carries them", () => {
    const { input, drop, names, written, done } = render({ multiple: true });
    drop([pdf("bail.pdf"), pdf("quittance.pdf")]);
    expect(names()).toEqual(["bail.pdf", "quittance.pdf"]);
    expect(written()).toEqual(["bail.pdf", "quittance.pdf"]);
    expect(input.name).toBe("justificatif");
    done();
  });

  it("shows the drag state while a file hovers", () => {
    const { target, fire, done } = render();
    fire("dragenter", [pdf("bail.pdf")]);
    expect(target.textContent).toContain("Déposez votre fichier");
    fire("dragleave", [pdf("bail.pdf")]);
    expect(target.textContent).toContain("Glissez votre fichier ici");
    done();
  });

  it("refuses the wrong format and a file too heavy, and says so", () => {
    const rejected: string[] = [];
    const { target, drop, names, done } = render({
      accept: ".pdf",
      maxFileSize: 100,
      multiple: true,
      onFileRejected: (list: { reason: string }[]) => rejected.push(...list.map((r) => r.reason)),
    });
    const photo = new File(["x"], "photo.png", { type: "image/png" });
    drop([photo, pdf("gros.pdf", 500), pdf("ok.pdf")]);
    expect(names()).toEqual(["ok.pdf"]);
    expect(rejected).toEqual(["type", "size"]);
    expect(target.textContent).toContain("photo.png : format non accepté");
    expect(target.textContent).toContain("gros.pdf : fichier trop lourd");
    done();
  });

  it("stops at maxFiles", () => {
    const { target, drop, names, done } = render({ multiple: true, maxFiles: 2 });
    drop([pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf")]);
    expect(names()).toEqual(["a.pdf", "b.pdf"]);
    expect(target.textContent).toContain("2 fichiers au maximum");
    done();
  });

  it("removes a file from the list and from the input", () => {
    const { target, drop, names, written, done } = render({ multiple: true });
    drop([pdf("a.pdf"), pdf("b.pdf")]);
    target.querySelector<HTMLButtonElement>('[aria-label="Retirer a.pdf"]')?.click();
    flushSync();
    expect(names()).toEqual(["b.pdf"]);
    expect(written()).toEqual(["b.pdf"]);
    done();
  });

  it("puts the one file in the zone's place, and brings the zone back on removal", () => {
    const { target, drop, done } = render();
    drop([pdf("bail.pdf")]);
    expect(target.querySelector("[data-slot=file-drop-zone-target]")).toBeNull();
    target.querySelector<HTMLButtonElement>('[aria-label="Retirer bail.pdf"]')?.click();
    flushSync();
    expect(target.querySelector("[data-slot=file-drop-zone-target]")).not.toBeNull();
    done();
  });

  it("ignores drops while disabled", () => {
    const { drop, names, done } = render({ disabled: true });
    drop([pdf("bail.pdf")]);
    expect(names()).toEqual([]);
    done();
  });
});

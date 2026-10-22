import { describe, expect, it } from "vite-plus/test";
import { buildThread, fillCount, resolveThreadLabels, resolvedCount } from "#src/thread/logic.js";
import { DEFAULT_THREAD_LABELS, type ThreadComment } from "#src/thread/types.js";

const ada = { kind: "user", name: "Ada" } as const;
const bot = { kind: "agent", name: "Scribe" } as const;

function comment(id: string, at: string, extra: Partial<ThreadComment> = {}): ThreadComment {
  return { id, author: ada, body: id, createdAt: at, ...extra };
}

describe("buildThread", () => {
  it("puts replies under their root in time order", () => {
    const nodes = buildThread([
      comment("r2", "2026-10-22T10:05:00Z", { parentId: "a" }),
      comment("a", "2026-10-22T10:00:00Z"),
      comment("b", "2026-10-22T10:02:00Z", { author: bot }),
      comment("r1", "2026-10-22T10:03:00Z", { parentId: "a" }),
    ]);
    expect(nodes.map((n) => n.comment.id)).toEqual(["a", "b"]);
    expect(nodes[0].replies.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("keeps a reply to a reply under the root", () => {
    const nodes = buildThread([
      comment("a", "2026-10-22T10:00:00Z"),
      comment("r1", "2026-10-22T10:01:00Z", { parentId: "a" }),
      comment("r2", "2026-10-22T10:02:00Z", { parentId: "r1" }),
    ]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].replies.map((r) => r.id)).toEqual(["r1", "r2"]);
  });

  it("turns an orphan reply into a root and survives a parent loop", () => {
    const nodes = buildThread([
      comment("x", "2026-10-22T10:00:00Z", { parentId: "gone" }),
      comment("p", "2026-10-22T10:01:00Z", { parentId: "q" }),
      comment("q", "2026-10-22T10:02:00Z", { parentId: "p" }),
    ]);
    expect(nodes.map((n) => n.comment.id)).toContain("x");
    expect(nodes.flatMap((n) => [n.comment.id, ...n.replies.map((r) => r.id)]).sort()).toEqual([
      "p",
      "q",
      "x",
    ]);
  });

  it("sorts a malformed timestamp last", () => {
    const nodes = buildThread([comment("bad", "soon"), comment("ok", "2026-10-22T10:00:00Z")]);
    expect(nodes.map((n) => n.comment.id)).toEqual(["ok", "bad"]);
  });

  it("counts resolved roots", () => {
    const nodes = buildThread([
      comment("a", "2026-10-22T10:00:00Z", { resolved: true }),
      comment("b", "2026-10-22T10:01:00Z"),
    ]);
    expect(resolvedCount(nodes)).toBe(1);
  });
});

describe("labels", () => {
  it("lets a host write French over the English defaults", () => {
    const fr = resolveThreadLabels({
      title: "Activité",
      send: "Commenter",
      showResolved: "Afficher {count} résolus",
    });
    expect(fr.title).toBe("Activité");
    expect(fr.cancel).toBe(DEFAULT_THREAD_LABELS.cancel);
    expect(fillCount(fr.showResolved, 3)).toBe("Afficher 3 résolus");
  });
});

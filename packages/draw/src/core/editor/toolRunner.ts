// The tool state machine: a tool is a tree of ToolState nodes, and a transition
// exits the old leaf up to the common ancestor, then enters the new one.

import type { EditorApi, Mods, PointerInfo, ToolFactory, ToolState } from "../types";

/** The input handler names a pointer event can reach. */
type PointerHandler = "onPointerDown" | "onPointerMove" | "onPointerUp";

export type ToolRunner = {
  /** Add a tool by id. Re-registering drops the built tree so it rebuilds. */
  register(id: string, factory: ToolFactory): void;
  /** Make a tool active. Enters its root and its initial child chain. */
  setTool(id: string): void;
  /** Move to a state by dotted path, for example "select.translating". */
  transition(path: string, info?: unknown): void;
  /** The dotted path to the active leaf, for example "select.idle". */
  getActivePath(): string;
  /** The active nodes, root first, leaf last. */
  getActiveStates(): ToolState[];
  /** Find the nearest active state with a pointer handler and call it. */
  pointer(handler: PointerHandler, info: PointerInfo): void;
  keyDown(key: string, mods: Mods): void;
  keyUp(key: string): void;
  /** Escape or a lost pointer: run `onCancel` on every active state, leaf first. */
  cancel(): void;
};

/** Walk down from `node` through `initial` children, appending to `path`. */
function descend(node: ToolState, path: ToolState[]): ToolState {
  let current = node;
  while (current.children && current.initial) {
    const child = current.children[current.initial];
    if (!child) {
      throw new Error(`Tool state "${current.id}" has no initial child "${current.initial}"`);
    }
    path.push(child);
    current = child;
  }
  return current;
}

export function createToolRunner(editor: EditorApi, notifyChange: () => void): ToolRunner {
  const factories = new Map<string, ToolFactory>();
  const roots = new Map<string, ToolState>();
  let activeToolId: string | null = null;
  let activePath: ToolState[] = [];

  function rootFor(id: string): ToolState {
    const cached = roots.get(id);
    if (cached) return cached;
    const factory = factories.get(id);
    if (!factory) throw new Error(`Unknown tool: "${id}"`);
    const root = factory(editor);
    roots.set(id, root);
    return root;
  }

  function apply(next: ToolState[], toolId: string, info: unknown): void {
    const old = activePath;
    let common = 0;
    while (common < old.length && common < next.length && old[common] === next[common]) {
      common += 1;
    }
    for (let i = old.length - 1; i >= common; i -= 1) {
      old[i]?.onExit?.();
    }
    for (let i = common; i < next.length; i += 1) {
      next[i]?.onEnter?.(info);
    }
    activePath = next;
    activeToolId = toolId;
    notifyChange();
  }

  function register(id: string, factory: ToolFactory): void {
    factories.set(id, factory);
    roots.delete(id);
  }

  function setTool(id: string): void {
    const root = rootFor(id);
    const path = [root];
    descend(root, path);
    apply(path, id, undefined);
  }

  function transition(path: string, info?: unknown): void {
    const segments = path.split(".").filter((segment) => segment.length > 0);
    if (segments.length === 0 || activeToolId === null || segments[0] !== activeToolId) {
      throw new Error(`Unknown tool state path: "${path}"`);
    }
    const root = rootFor(activeToolId);
    const next = [root];
    let node = root;
    for (let i = 1; i < segments.length; i += 1) {
      const child = node.children?.[segments[i]];
      if (!child) throw new Error(`Unknown tool state path: "${path}"`);
      next.push(child);
      node = child;
    }
    descend(node, next);
    apply(next, activeToolId, info);
  }

  function pointer(handler: PointerHandler, info: PointerInfo): void {
    for (let i = activePath.length - 1; i >= 0; i -= 1) {
      const node = activePath[i];
      const fn = node?.[handler];
      if (fn) {
        fn(info);
        return;
      }
    }
  }

  function keyDown(key: string, mods: Mods): void {
    for (let i = activePath.length - 1; i >= 0; i -= 1) {
      const node = activePath[i];
      if (node?.onKeyDown) {
        node.onKeyDown(key, mods);
        return;
      }
    }
  }

  function keyUp(key: string): void {
    for (let i = activePath.length - 1; i >= 0; i -= 1) {
      const node = activePath[i];
      if (node?.onKeyUp) {
        node.onKeyUp(key);
        return;
      }
    }
  }

  function cancel(): void {
    for (let i = activePath.length - 1; i >= 0; i -= 1) {
      activePath[i]?.onCancel?.();
    }
  }

  return {
    register,
    setTool,
    transition,
    getActivePath: () => activePath.map((node) => node.id).join("."),
    getActiveStates: () => [...activePath],
    pointer,
    keyDown,
    keyUp,
    cancel,
  };
}

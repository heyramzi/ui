// The renderer's public contract. Workers never edit this file.

import type { Component } from "svelte";
import type { Editor } from "../core/editor";
import type { NodeComponentProps } from "../core/types";

/** Node components by the `kind` prop of a `node` shape. */
export type NodeComponents = Record<string, Component<NodeComponentProps<any>>>;

export type DrawProps = {
  editor: Editor;
  /** Components that render `node` shapes. A kind with no component draws a labeled box. */
  nodes?: NodeComponents;
  style?: "hand" | "clean";
  dark?: boolean;
  /** Extra class on the root element. */
  class?: string;
};

/** Props the host passes to the component that renders one `node` shape. */
export type NodeHostProps = {
  shape: import("../core/types").ShapeRecord;
  component: Component<NodeComponentProps<any>>;
  selected: boolean;
};

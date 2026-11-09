/** The ESTree and TS-ESTree fields this script reads. Svelte types its AST as plain ESTree,
 *  which has no TypeScript nodes, so the parser's output is read through this one shape. */
export interface Node {
  type: string;
  start: number;
  end: number;
  name?: string;
  value?: unknown;
  operator?: string;
  optional?: boolean;
  computed?: boolean;
  exportKind?: string;
  left?: Node;
  right?: Node;
  key?: Node;
  local?: Node;
  exported?: Node;
  imported?: Node;
  source?: Node;
  id?: Node;
  init?: Node | null;
  callee?: Node;
  expression?: Node;
  literal?: Node;
  typeName?: Node;
  exprName?: Node;
  objectType?: Node;
  indexType?: Node;
  typeAnnotation?: Node;
  returnType?: Node;
  declaration?: Node | null;
  typeArguments?: Node;
  typeParameters?: Node;
  body?: Node | Node[];
  types?: Node[];
  members?: Node[];
  properties?: Node[];
  specifiers?: Node[];
  declarations?: Node[];
  arguments?: Node[];
  extends?: Node[];
  params?: Node[];
  leadingComments?: { type: string; value: string }[];
}

export type Rec = {
  file: string;
  src: string;
  instance?: Node;
  programs: Node[];
  scope?: Map<string, Binding>;
};
export type Binding =
  | { kind: "type"; node: Node }
  | { kind: "var"; node?: Node | null }
  | { kind: "import"; source: string; imported: string };
export type Member = {
  name: string;
  type?: string;
  optional?: boolean;
  values?: string[];
  description?: string;
  default?: string;
  inherited?: boolean;
};
export type Base = { kind: string; label: string; from?: string; omit?: string[] };
export type Acc = { members: Map<string, Member>; bases: Base[] };
export type Row = {
  name: string;
  type?: string;
  values?: string[];
  default?: string;
  bindable?: boolean;
  required?: boolean;
  description?: string;
};
export type Part = { name: string; file: string; props: Row[]; bases: Base[]; untyped?: boolean };

export const isNode = (x: unknown): x is Node =>
  typeof x === "object" && x !== null && "type" in x && typeof x.type === "string";
export const list = (x: Node | Node[] | undefined): Node[] => (Array.isArray(x) ? x : []);

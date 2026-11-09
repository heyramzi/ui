#!/usr/bin/env node
/* Reads each component's `$props()` typing and writes the API tables the component pages show.
 *
 *   node site/scripts/component-api.ts          write site/src/lib/component-api.json
 *   node site/scripts/component-api.ts --check  exit 1 when the committed JSON is stale
 *
 * Svelte's own parser reads the TypeScript, so nothing is installed for it. A prop's type is
 * the text the file wrote; a type the file pulls from bits-ui or svelte/elements becomes one
 * "...rest" row naming it instead of being expanded. */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "svelte/compiler";
import { componentSources } from "../src/lib/component-sources.ts";
import { meta } from "../src/lib/registry-meta.ts";

const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = resolve(SITE, "..");
const UI_SRC = join(ROOT, "packages/ui/src");
const OUT = join(SITE, "src/lib/component-api.json");
const CHECK = process.argv.includes("--check");

/** Longest default shown as written; past it the cell would push the table wide. */
const MAX_DEFAULT = 80;

/** Types a destructured-only prop gets when its base type is outside the repo. */
const INHERITED_TYPES: Record<string, string> = {
  class: "string",
  style: "string",
  id: "string",
  children: "Snippet",
  child: "Snippet",
  href: "string",
  disabled: "boolean",
  open: "boolean",
  type: '"button" | "submit" | "reset"',
};

/** The ESTree and TS-ESTree fields this script reads. Svelte types its AST as plain ESTree,
 *  which has no TypeScript nodes, so the parser's output is read through this one shape. */
interface Node {
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

type Rec = {
  file: string;
  src: string;
  instance?: Node;
  programs: Node[];
  scope?: Map<string, Binding>;
};
type Binding =
  | { kind: "type"; node: Node }
  | { kind: "var"; node?: Node | null }
  | { kind: "import"; source: string; imported: string };
type Member = {
  name: string;
  type?: string;
  optional?: boolean;
  values?: string[];
  description?: string;
  default?: string;
  inherited?: boolean;
};
type Base = { kind: string; label: string; from?: string; omit?: string[] };
type Acc = { members: Map<string, Member>; bases: Base[] };
type Row = {
  name: string;
  type?: string;
  values?: string[];
  default?: string;
  bindable?: boolean;
  required?: boolean;
  description?: string;
};
type Part = { name: string; file: string; props: Row[]; bases: Base[]; untyped?: boolean };

const isNode = (x: unknown): x is Node =>
  typeof x === "object" && x !== null && "type" in x && typeof x.type === "string";
const list = (x: Node | Node[] | undefined): Node[] => (Array.isArray(x) ? x : []);

// ========================= FILES

const parsed = new Map<string, Rec>();

/** A parsed file: its source and its programs (module first). A `.ts` file is read through a
 *  `<script lang="ts">` wrapper so the one Svelte parser covers both. */
function read(file: string): Rec {
  const cached = parsed.get(file);
  if (cached) return cached;
  const raw = readFileSync(file, "utf8");
  const src = file.endsWith(".svelte") ? raw : `<script lang="ts">${raw}</script>`;
  const ast = parse(src, { modern: true });
  const module: unknown = ast.module?.content;
  const instance: unknown = ast.instance?.content;
  const rec: Rec = {
    file,
    src,
    instance: isNode(instance) ? instance : undefined,
    programs: [module, instance].filter(isNode),
  };
  parsed.set(file, rec);
  return rec;
}

/** A local import specifier to a file on disk, or null for a package. */
function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("#src/")) base = join(UI_SRC, spec.slice(5));
  else if (spec.startsWith(".")) base = resolve(dirname(from), spec);
  else return null;
  const stem = base.replace(/\.js$/, "");
  for (const candidate of [base, `${stem}.ts`, `${stem}.svelte.ts`, `${stem}/index.ts`]) {
    if (existsSync(candidate) && !candidate.endsWith("/")) return candidate;
  }
  return null;
}

const text = (rec: Rec, node: Node) =>
  rec.src.slice(node.start, node.end).replace(/\s+/g, " ").trim();
const keyName = (key?: Node) =>
  key?.type === "Identifier" ? (key.name ?? "") : String(key?.value ?? "");
const typeArgs = (node: Node) => (node.typeArguments ?? node.typeParameters)?.params ?? [];
const entityName = (node?: Node): string =>
  node?.type === "TSQualifiedName"
    ? `${entityName(node.left)}.${node.right?.name}`
    : (node?.name ?? "");

// ========================= SCOPE

/** Every name a file declares, imports or re-exports at the top level. */
function scopeOf(rec: Rec): Map<string, Binding> {
  if (rec.scope) return rec.scope;
  const scope = new Map<string, Binding>();
  for (const program of rec.programs) {
    for (const stmt of list(program.body)) {
      if (stmt.type === "ExportNamedDeclaration" && stmt.source) {
        for (const s of stmt.specifiers ?? []) {
          scope.set(keyName(s.exported), {
            kind: "import",
            source: String(stmt.source.value),
            imported: keyName(s.local),
          });
        }
        continue;
      }
      const node =
        stmt.type === "ExportNamedDeclaration" && stmt.declaration ? stmt.declaration : stmt;
      if (node.type === "TSTypeAliasDeclaration" || node.type === "TSInterfaceDeclaration") {
        scope.set(node.id?.name ?? "", { kind: "type", node });
      } else if (node.type === "VariableDeclaration") {
        for (const d of node.declarations ?? []) {
          if (d.id?.type === "Identifier")
            scope.set(d.id.name ?? "", { kind: "var", node: d.init });
        }
      } else if (node.type === "ImportDeclaration") {
        for (const s of node.specifiers ?? []) {
          const imported =
            s.type === "ImportDefaultSpecifier"
              ? "default"
              : s.type === "ImportNamespaceSpecifier"
                ? "*"
                : keyName(s.imported);
          scope.set(s.local?.name ?? "", {
            kind: "import",
            source: String(node.source?.value),
            imported,
          });
        }
      }
    }
  }
  rec.scope = scope;
  return scope;
}

type Found = { rec: Rec; binding: Binding };

/** A name followed through local imports to where it's declared. */
function lookup(rec: Rec, name: string, depth = 0): Found | null {
  const binding = scopeOf(rec).get(name);
  if (!binding || depth > 8) return null;
  if (binding.kind !== "import") return { rec, binding };
  const target = resolveImport(rec.file, binding.source);
  if (!target || binding.imported === "*" || binding.imported === "default") {
    return { rec, binding };
  }
  return lookup(read(target), binding.imported, depth + 1);
}

const typeDecl = (found: Found | null) =>
  found?.binding.kind === "type" ? found.binding.node : null;
const varInit = (found: Found | null) =>
  found?.binding.kind === "var" ? found.binding.node : null;

// ========================= VARIANTS AND LITERALS

const propOf = (obj: Node | null | undefined, name: string): Node | undefined => {
  if (obj?.type !== "ObjectExpression") return undefined;
  const prop = obj.properties?.find((p) => p.type === "Property" && keyName(p.key) === name);
  return isNode(prop?.value) ? prop.value : undefined;
};

type Variants = { rec: Rec; config: Node };

/** The `tv({...})` config behind a variable, with the file it lives in. */
function variantConfig(rec: Rec, name: string): Variants | null {
  const found = lookup(rec, name);
  const call = varInit(found);
  const config = call?.type === "CallExpression" ? call.arguments?.[0] : undefined;
  if (!found || config?.type !== "ObjectExpression") return null;
  return { rec: found.rec, config };
}

/** A variant's options as quoted values, or null for a true/false switch. */
function variantValues(entry: Variants, key: string): string[] | null {
  const options = propOf(propOf(entry.config, "variants"), key);
  if (options?.type !== "ObjectExpression") return null;
  const keys = (options.properties ?? []).map((p) => keyName(p.key));
  if (keys.length === 2 && keys.includes("true") && keys.includes("false")) return null;
  return keys.map((k) => JSON.stringify(k));
}

/** The allowed values a type stands for, when it names a closed set the reader can't see. */
function literalValues(rec: Rec, node: Node | undefined, depth = 0): string[] | null {
  if (!node || depth > 6) return null;
  if (node.type === "TSParenthesizedType") return literalValues(rec, node.typeAnnotation, depth);
  if (node.type === "TSUnionType") {
    const values: string[] = [];
    for (const member of node.types ?? []) {
      if (member.type === "TSUndefinedKeyword" || member.type === "TSNullKeyword") continue;
      const inner = literalValues(rec, member, depth + 1);
      if (!inner) return null;
      values.push(...inner);
    }
    return values.length ? values : null;
  }
  if (node.type === "TSLiteralType" && node.literal?.type === "Literal") {
    return [JSON.stringify(node.literal.value)];
  }
  if (node.type === "TSTypeReference" && node.typeName?.type === "Identifier") {
    const found = lookup(rec, node.typeName.name ?? "");
    const decl = typeDecl(found);
    if (found && decl?.type === "TSTypeAliasDeclaration") {
      return literalValues(found.rec, decl.typeAnnotation, depth + 1);
    }
    return null;
  }
  if (node.type === "TSIndexedAccessType") {
    const obj = node.objectType;
    const index = node.indexType;
    if (
      obj?.type === "TSTypeReference" &&
      entityName(obj.typeName) === "VariantProps" &&
      index?.type === "TSLiteralType"
    ) {
      const query = typeArgs(obj)[0];
      if (query?.type !== "TSTypeQuery") return null;
      const entry = variantConfig(rec, entityName(query.exprName));
      return entry ? variantValues(entry, String(index.literal?.value)) : null;
    }
    return null;
  }
  if (node.type === "TSTypeOperator" && node.operator === "keyof") {
    const query = node.typeAnnotation;
    if (query?.type !== "TSTypeQuery") return null;
    let init = varInit(lookup(rec, entityName(query.exprName)));
    while (init?.type === "TSAsExpression" || init?.type === "TSSatisfiesExpression") {
      init = init.expression;
    }
    if (init?.type !== "ObjectExpression") return null;
    return (init.properties ?? [])
      .filter((p) => p.type === "Property")
      .map((p) => JSON.stringify(keyName(p.key)));
  }
  return null;
}

// ========================= PROPS

/** The JSDoc block right above a node, as one line, with its `@default` pulled out. */
function jsdoc(node: Node): { description?: string; default?: string } {
  const block = node.leadingComments?.findLast(
    (c) => c.type === "Block" && c.value.startsWith("*"),
  );
  if (!block) return {};
  const lines = block.value
    .slice(1)
    .split("\n")
    .map((l) => l.replace(/^\s*\*?\s?/, "").trim());
  const tag = lines.find((l) => l.startsWith("@default"));
  const description = lines
    .filter((l) => !l.startsWith("@"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return {
    description: description || undefined,
    default: tag ? tag.slice("@default".length).trim() : undefined,
  };
}

/** The element `WithElementRef<HTMLAttributes<HTMLDivElement>>` binds its ref to. */
function elementOf(rec: Rec, attrs: Node | undefined): string {
  if (attrs?.type !== "TSTypeReference") return "HTMLElement";
  const arg = typeArgs(attrs)[0];
  if (arg) return text(rec, arg);
  const match = entityName(attrs.typeName).match(/^HTML(\w+)Attributes$/);
  return match ? `HTML${match[1]}Element` : "HTMLElement";
}

/** What a base outside the repo is called on the page: `Dialog.Content` from bits-ui for
 *  `DialogPrimitive.ContentProps` or `ComponentProps<typeof DialogPrimitive.Content>`. */
function baseOf(rec: Rec, name: Node | undefined, label: string, kind = "type"): Base {
  const root = name?.type === "TSQualifiedName" ? name.left : name;
  const binding = root?.type === "Identifier" ? scopeOf(rec).get(root.name ?? "") : undefined;
  if (binding?.kind !== "import" || resolveImport(rec.file, binding.source)) return { kind, label };
  if (name?.type === "TSQualifiedName" && binding.imported !== "*") {
    const part = (name.right?.name ?? "").replace(/Props$/, "") || "Root";
    return { kind: "package", label: `${binding.imported}.${part}`, from: binding.source };
  }
  return { kind: "package", label, from: binding.source };
}

const WITHOUT: Record<string, string[]> = {
  WithoutChildren: ["children"],
  WithoutChild: ["child"],
  WithoutChildrenOrChild: ["children", "child"],
};

/** Walks a props type into the members the repo declares and the bases it can't see into. */
function collect(
  rec: Rec,
  node: Node | undefined,
  acc: Acc,
  omit = new Set<string>(),
  depth = 0,
): void {
  if (!node || depth > 12) return;
  const recurse = (r: Rec, n: Node | undefined, o = omit): void => collect(r, n, acc, o, depth + 1);
  const addBase = (base: Base) => {
    const omitted = [...omit].sort();
    if (!acc.bases.some((b) => b.label === base.label)) {
      acc.bases.push(omitted.length ? { ...base, omit: omitted } : base);
    }
  };
  const addMember = (member: Member) => {
    if (omit.has(member.name)) return;
    const prior = acc.members.get(member.name);
    acc.members.set(member.name, prior ? { ...prior, ...member } : member);
  };
  /** Members only, collected apart: a union's branches, a `Partial`, a mapped alias. */
  const membersOf = (r: Rec, n: Node | undefined, bases = acc.bases) => {
    const inner: Acc = { members: new Map(), bases };
    collect(r, n, inner, omit, depth + 1);
    return inner.members;
  };

  switch (node.type) {
    case "TSParenthesizedType":
      return recurse(rec, node.typeAnnotation);
    case "TSIntersectionType":
      for (const part of node.types ?? []) recurse(rec, part);
      return;
    case "TSUnionType": {
      const branches = (node.types ?? []).map((t) => membersOf(rec, t));
      for (const members of branches) {
        for (const member of members.values()) {
          const everywhere = branches.every((m) => m.has(member.name));
          addMember(everywhere ? member : { ...member, optional: true });
        }
      }
      return;
    }
    case "TSTypeLiteral":
      for (const m of node.members ?? []) signature(rec, m).forEach(addMember);
      return;
    case "TSTypeReference":
      break;
    default:
      return addBase({ kind: "type", label: text(rec, node) });
  }

  const name = entityName(node.typeName);
  const args = typeArgs(node);
  if (name === "WithElementRef") {
    recurse(rec, args[0]);
    const element = args[1] ? text(rec, args[1]) : elementOf(rec, args[0]);
    const prior = acc.members.get("ref")?.type?.replace(/ \| null$/, "");
    const type = prior && prior !== element ? `${prior} | ${element} | null` : `${element} | null`;
    addMember({ name: "ref", type, optional: true, inherited: true });
    return;
  }
  if (WITHOUT[name]) return recurse(rec, args[0], new Set([...omit, ...WITHOUT[name]]));
  if (name === "Omit" && args[1]) {
    const keys = (literalValues(rec, args[1]) ?? []).map((v) => String(JSON.parse(v)));
    return recurse(rec, args[0], new Set([...omit, ...keys]));
  }
  if (name === "Partial") {
    for (const m of membersOf(rec, args[0]).values()) addMember({ ...m, optional: true });
    return;
  }
  if (name === "VariantProps" && args[0]?.type === "TSTypeQuery") {
    const entry = variantConfig(rec, entityName(args[0].exprName));
    const variants = propOf(entry?.config, "variants");
    if (!entry || variants?.type !== "ObjectExpression") {
      return addBase({ kind: "type", label: text(rec, node) });
    }
    const defaults = propOf(entry.config, "defaultVariants");
    for (const p of variants.properties ?? []) {
      const key = keyName(p.key);
      const values = variantValues(entry, key);
      const fallback = propOf(defaults, key);
      addMember({
        name: key,
        type: values ? values.join(" | ") : "boolean",
        optional: true,
        values: values ?? undefined,
        default: fallback ? text(entry.rec, fallback) : undefined,
      });
    }
    return;
  }
  if (name === "ComponentProps" && args[0]?.type === "TSTypeQuery") {
    const expr = args[0].exprName;
    return addBase(baseOf(rec, expr, entityName(expr), "component"));
  }

  if (node.typeName?.type === "Identifier") {
    const found = lookup(rec, node.typeName.name ?? "");
    const decl = typeDecl(found);
    if (found && decl) {
      // A generic mapped alias (`KnownProps<T>`) filters T's keys: keep T's members, drop
      // the index signature it exists to strip.
      if (decl.typeAnnotation?.type === "TSMappedType" && args[0]) {
        membersOf(rec, args[0], []).forEach(addMember);
        return;
      }
      if (decl.type === "TSTypeAliasDeclaration") return recurse(found.rec, decl.typeAnnotation);
      const body = Array.isArray(decl.body) ? [] : list(decl.body?.body);
      for (const m of body) signature(found.rec, m).forEach(addMember);
      for (const heritage of decl.extends ?? []) {
        recurse(found.rec, {
          ...heritage,
          type: "TSTypeReference",
          typeName: heritage.expression,
          typeArguments: heritage.typeArguments ?? heritage.typeParameters,
        });
      }
      return;
    }
  }
  addBase(baseOf(rec, node.typeName, text(rec, node)));
}

/** One member of a type literal or interface, as a row; nothing for index signatures. */
function signature(rec: Rec, m: Node): Member[] {
  if (m.type !== "TSPropertySignature" && m.type !== "TSMethodSignature") return [];
  if (m.computed || !m.key) return [];
  const doc = jsdoc(m);
  const annotation = m.typeAnnotation?.typeAnnotation;
  const type =
    m.type === "TSMethodSignature"
      ? rec.src.slice(m.key.end, m.end).replace(/\s+/g, " ").replace(/;$/, "").trim()
      : annotation
        ? text(rec, annotation)
        : "any";
  const values = m.type === "TSPropertySignature" ? literalValues(rec, annotation) : null;
  const written = values?.join(" | ") === type.replace(/^\| /, "");
  return [
    {
      name: keyName(m.key),
      type,
      optional: Boolean(m.optional),
      values: values && !written ? values : undefined,
      description: doc.description,
      default: doc.default,
    },
  ];
}

/** The `let {...}: T = $props()` declarator in a component's instance script. */
function propsDeclarator(rec: Rec): Node | null {
  for (const stmt of list(rec.instance?.body)) {
    if (stmt.type !== "VariableDeclaration") continue;
    for (const d of stmt.declarations ?? []) {
      if (d.init?.type === "CallExpression" && d.init.callee?.name === "$props") return d;
    }
  }
  return null;
}

const shorten = (value: string) =>
  value.length > MAX_DEFAULT ? `${value.slice(0, MAX_DEFAULT - 3)}...` : value;

/** A primitive default's type, for a prop the file only destructures. */
function inferType(fallback: Node | null): string | undefined {
  if (fallback?.type === "TemplateLiteral") return "string";
  if (fallback?.type !== "Literal" || fallback.value === null) return undefined;
  return typeof fallback.value;
}

/** One component file's props table. */
function partOf(file: string): Omit<Part, "name" | "file"> {
  const rec = read(file);
  const decl = propsDeclarator(rec);
  if (!decl?.id) return { props: [], bases: [] };

  const acc: Acc = { members: new Map(), bases: [] };
  const annotation = decl.id.typeAnnotation?.typeAnnotation;
  if (annotation) collect(rec, annotation, acc);

  const destructured = new Map<
    string,
    { bindable: boolean; fallback: Node | null; default?: string }
  >();
  if (decl.id.type === "ObjectPattern") {
    for (const p of decl.id.properties ?? []) {
      if (p.type !== "Property" || !isNode(p.value)) continue;
      let fallback = p.value.type === "AssignmentPattern" ? (p.value.right ?? null) : null;
      let bindable = false;
      if (fallback?.type === "CallExpression" && fallback.callee?.name === "$bindable") {
        bindable = true;
        fallback = fallback.arguments?.[0] ?? null;
      }
      destructured.set(keyName(p.key), {
        bindable,
        fallback,
        default: fallback ? shorten(text(rec, fallback)) : undefined,
      });
    }
  }

  const row = (member: Member, own: boolean): Row => {
    const local = destructured.get(member.name);
    const fallback = local?.default ?? member.default;
    return {
      name: member.name,
      type: member.type || undefined,
      values: member.values,
      default: fallback,
      bindable: local?.bindable || undefined,
      required: (!member.optional && fallback === undefined && own) || undefined,
      description: member.description,
    };
  };

  const members = [...acc.members.values()];
  const props = [
    ...members.filter((m) => !m.inherited).map((m) => row(m, true)),
    ...members.filter((m) => m.inherited).map((m) => row(m, false)),
  ];
  // A headless primitive's ref is its root element, typed HTMLElement across bits-ui.
  const primitive = acc.bases.some((b) => b.from && b.from !== "svelte/elements");
  for (const [name, local] of destructured) {
    if (acc.members.has(name)) continue;
    let type: string | undefined = INHERITED_TYPES[name] ?? inferType(local.fallback);
    if (name === "ref") type = primitive ? "HTMLElement | null" : undefined;
    props.push(row({ name, type, optional: true }, false));
  }

  return { props, bases: acc.bases, untyped: annotation ? undefined : true };
}

// ========================= PAGES

const pascal = (s: string) =>
  s
    .replace(/\.svelte$/, "")
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");

/** What a folder's index.ts exports each component file as, in export order. */
function exportsOf(dir: string): Map<string, string[]> {
  const index = join(dir, "index.ts");
  const names = new Map<string, string[]>();
  if (!existsSync(index)) return names;
  const rec = read(index);
  const add = (file: string | null, name: string) => {
    if (!file?.endsWith(".svelte")) return;
    names.set(file, [...(names.get(file) ?? []), name]);
  };
  for (const stmt of rec.programs.flatMap((p) => list(p.body))) {
    if (stmt.type !== "ExportNamedDeclaration") continue;
    for (const s of stmt.specifiers ?? []) {
      if (s.exportKind === "type") continue;
      const local = keyName(s.local);
      const exported = keyName(s.exported);
      if (stmt.source) {
        if (local === "default") add(resolveImport(index, String(stmt.source.value)), exported);
        continue;
      }
      const binding = scopeOf(rec).get(local);
      if (binding?.kind === "import" && binding.imported === "default") {
        add(resolveImport(index, binding.source), exported);
      }
    }
  }
  return names;
}

/** The component files a page documents: its listed sources, plus the rest of the folder named
 *  after the slug, since a primitive's parts (Dialog.Trigger) are all one page. */
function filesOf(slug: string): string[] {
  const listed = (componentSources[slug] ?? []).map((p) => join(ROOT, p));
  const dirs = new Set(listed.map((p) => dirname(p)).filter((d) => basename(d) === slug));
  for (const group of ["shadcn", "components"]) {
    const dir = join(UI_SRC, group, slug);
    if (!listed.length && existsSync(dir)) dirs.add(dir);
  }
  const files = listed.filter((f) => f.endsWith(".svelte"));
  for (const dir of [...dirs].sort()) {
    const exported = [...exportsOf(dir).keys()];
    const own = exported.length
      ? exported
      : readdirSync(dir)
          .filter((f) => f.endsWith(".svelte"))
          .sort()
          .map((f) => join(dir, f));
    for (const f of own) if (!files.includes(f)) files.push(f);
  }
  return files;
}

/** The name a part goes by in code: `Dialog.Trigger` for a namespaced primitive, else its
 *  export. `tags` are every spelling the demo might use, for ordering. */
function namesOf(files: string[]): { label: string; tags: string[] }[] {
  return files.map((file) => {
    const dirExports = exportsOf(dirname(file));
    const exported = dirExports.get(file) ?? [];
    const rootNames = [...dirExports.values()].find((n) => n.includes("Root"));
    const ns = rootNames?.find((n) => n !== "Root");
    if (ns && exported.length) {
      const short = exported.find((n) => !n.startsWith(ns) || n === ns) ?? exported[0];
      const siblings = files.filter((f) => dirname(f) === dirname(file)).length;
      return { label: siblings > 1 ? `${ns}.${short}` : ns, tags: [`${ns}.${short}`, ...exported] };
    }
    const label = exported[0] ?? pascal(basename(file));
    return { label, tags: [label] };
  });
}

/** Parts in the order the page's demo first uses them, unused ones after, main file first. */
function ordered<T extends { tags: string[] }>(slug: string, parts: T[]): T[] {
  const demo = [
    join(SITE, "src/lib/demos", `${slug}.svelte`),
    join(SITE, "src/lib/shadcn-demos", `${slug}.svelte`),
  ]
    .filter((f) => existsSync(f))
    .map((f) => readFileSync(f, "utf8"))
    .join("\n");
  const firstUse = (part: T) => {
    const hits = part.tags
      .map((tag) => demo.search(new RegExp(`<${tag.replace(".", "\\.")}[\\s/>]`)))
      .filter((i) => i >= 0);
    return hits.length ? Math.min(...hits) : Infinity;
  };
  const [main, ...rest] = parts;
  const ranked = rest
    .map((part, i) => ({ part, i, at: firstUse(part) }))
    .sort((a, b) => a.at - b.at || a.i - b.i)
    .map((r) => r.part);
  return main ? [main, ...ranked] : [];
}

function build(): Record<string, Part[]> {
  const demoSlugs = readdirSync(join(SITE, "src/lib/shadcn-demos"))
    .filter((f) => f.endsWith(".svelte"))
    .map((f) => f.replace(/\.svelte$/, ""));
  const slugs = [...new Set([...Object.keys(meta), ...demoSlugs])].sort();
  const out: Record<string, Part[]> = {};
  for (const slug of slugs) {
    const files = filesOf(slug);
    if (!files.length) continue;
    const names = namesOf(files);
    const parts = files.map((file, i) => ({
      name: names[i].label,
      tags: names[i].tags,
      file: relative(ROOT, file),
      ...partOf(file),
    }));
    out[slug] = ordered(slug, parts).map(({ tags: _tags, ...part }) => part);
  }
  return out;
}

// ========================= MAIN

/** JSON as `vp fmt` prints it, so the written file passes the format check: a list of plain
 *  values sits on one line when it fits in 100 columns. */
function serialize(value: unknown, indent = "", lead = 0, last = true): string {
  const tail = last ? 0 : 1;
  if (Array.isArray(value) && value.every((v) => typeof v !== "object" || v === null)) {
    const inline = `[${value.map((v) => JSON.stringify(v)).join(", ")}]`;
    if (lead + inline.length + tail <= 100) return inline;
  }
  if (typeof value !== "object" || value === null) return JSON.stringify(value);
  const inner = `${indent}  `;
  const entries: [string | null, unknown][] = Array.isArray(value)
    ? value.map((v) => [null, v])
    : Object.entries(value);
  if (!entries.length) return Array.isArray(value) ? "[]" : "{}";
  const lines = entries.map(([key, v], i) => {
    const head = key === null ? inner : `${inner}${JSON.stringify(key)}: `;
    return head + serialize(v, inner, head.length, i === entries.length - 1);
  });
  const [open, close] = Array.isArray(value) ? ["[", "]"] : ["{", "}"];
  return `${open}\n${lines.join(",\n")}\n${indent}${close}`;
}

const data = build();
// The round trip drops the undefined fields, the same as the committed file has them dropped.
const fresh: Record<string, unknown> = JSON.parse(JSON.stringify(data));

if (CHECK) {
  const committed: Record<string, unknown> | null = existsSync(OUT)
    ? JSON.parse(readFileSync(OUT, "utf8"))
    : null;
  const stale = Object.keys({ ...fresh, ...committed }).filter(
    (slug) => JSON.stringify(fresh[slug]) !== JSON.stringify(committed?.[slug]),
  );
  if (!committed || stale.length) {
    const which = stale.length ? ` for ${stale.join(", ")}` : "";
    console.error(`component-api.json is stale${which}. Run: node site/scripts/component-api.ts`);
    process.exit(1);
  }
  console.log(`component-api.json is current (${Object.keys(fresh).length} pages)`);
} else {
  writeFileSync(OUT, `${serialize(fresh)}\n`);
  const parts = Object.values(data).flat().length;
  console.log(`wrote ${relative(ROOT, OUT)}: ${Object.keys(data).length} pages, ${parts} parts`);
}

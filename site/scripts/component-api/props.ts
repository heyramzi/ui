import { literalValues, propOf, variantConfig, variantValues } from "./literals.ts";
import {
  entityName,
  keyName,
  lookup,
  read,
  resolveImport,
  scopeOf,
  text,
  typeArgs,
  typeDecl,
} from "./source.ts";
import {
  isNode,
  list,
  type Acc,
  type Base,
  type Member,
  type Node,
  type Part,
  type Rec,
  type Row,
} from "./types.ts";

/** Longest default shown as written; past it the cell would push the table wide. */
export const MAX_DEFAULT = 80;

/** Types a destructured-only prop gets when its base type is outside the repo. */
export const INHERITED_TYPES: Record<string, string> = {
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

// ========================= PROPS

/** The JSDoc block right above a node, as one line, with its `@default` pulled out. */
export function jsdoc(node: Node): { description?: string; default?: string } {
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
export function elementOf(rec: Rec, attrs: Node | undefined): string {
  if (attrs?.type !== "TSTypeReference") return "HTMLElement";
  const arg = typeArgs(attrs)[0];
  if (arg) return text(rec, arg);
  const match = entityName(attrs.typeName).match(/^HTML(\w+)Attributes$/);
  return match ? `HTML${match[1]}Element` : "HTMLElement";
}

/** What a base outside the repo is called on the page: `Dialog.Content` from bits-ui for
 *  `DialogPrimitive.ContentProps` or `ComponentProps<typeof DialogPrimitive.Content>`. */
export function baseOf(rec: Rec, name: Node | undefined, label: string, kind = "type"): Base {
  const root = name?.type === "TSQualifiedName" ? name.left : name;
  const binding = root?.type === "Identifier" ? scopeOf(rec).get(root.name ?? "") : undefined;
  if (binding?.kind !== "import" || resolveImport(rec.file, binding.source)) return { kind, label };
  if (name?.type === "TSQualifiedName" && binding.imported !== "*") {
    const part = (name.right?.name ?? "").replace(/Props$/, "") || "Root";
    return { kind: "package", label: `${binding.imported}.${part}`, from: binding.source };
  }
  return { kind: "package", label, from: binding.source };
}

export const WITHOUT: Record<string, string[]> = {
  WithoutChildren: ["children"],
  WithoutChild: ["child"],
  WithoutChildrenOrChild: ["children", "child"],
};

/** Walks a props type into the members the repo declares and the bases it can't see into. */
export function collect(
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
export function signature(rec: Rec, m: Node): Member[] {
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
export function propsDeclarator(rec: Rec): Node | null {
  for (const stmt of list(rec.instance?.body)) {
    if (stmt.type !== "VariableDeclaration") continue;
    for (const d of stmt.declarations ?? []) {
      if (d.init?.type === "CallExpression" && d.init.callee?.name === "$props") return d;
    }
  }
  return null;
}

export const shorten = (value: string) =>
  value.length > MAX_DEFAULT ? `${value.slice(0, MAX_DEFAULT - 3)}...` : value;

/** A primitive default's type, for a prop the file only destructures. */
export function inferType(fallback: Node | null): string | undefined {
  if (fallback?.type === "TemplateLiteral") return "string";
  if (fallback?.type !== "Literal" || fallback.value === null) return undefined;
  return typeof fallback.value;
}

/** One component file's props table. */
export function partOf(file: string): Omit<Part, "name" | "file"> {
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

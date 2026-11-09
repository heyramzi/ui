import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "svelte/compiler";
import { isNode, list, type Binding, type Node, type Rec } from "./types.ts";

export const SITE = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const ROOT = resolve(SITE, "..");
export const UI_SRC = join(ROOT, "packages/ui/src");

// ========================= FILES

export const parsed = new Map<string, Rec>();

/** A parsed file: its source and its programs (module first). A `.ts` file is read through a
 *  `<script lang="ts">` wrapper so the one Svelte parser covers both. */
export function read(file: string): Rec {
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
export function resolveImport(from: string, spec: string): string | null {
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

export const text = (rec: Rec, node: Node) =>
  rec.src.slice(node.start, node.end).replace(/\s+/g, " ").trim();
export const keyName = (key?: Node) =>
  key?.type === "Identifier" ? (key.name ?? "") : String(key?.value ?? "");
export const typeArgs = (node: Node) => (node.typeArguments ?? node.typeParameters)?.params ?? [];
export const entityName = (node?: Node): string =>
  node?.type === "TSQualifiedName"
    ? `${entityName(node.left)}.${node.right?.name}`
    : (node?.name ?? "");

// ========================= SCOPE

/** Every name a file declares, imports or re-exports at the top level. */
export function scopeOf(rec: Rec): Map<string, Binding> {
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

export type Found = { rec: Rec; binding: Binding };

/** A name followed through local imports to where it's declared. */
export function lookup(rec: Rec, name: string, depth = 0): Found | null {
  const binding = scopeOf(rec).get(name);
  if (!binding || depth > 8) return null;
  if (binding.kind !== "import") return { rec, binding };
  const target = resolveImport(rec.file, binding.source);
  if (!target || binding.imported === "*" || binding.imported === "default") {
    return { rec, binding };
  }
  return lookup(read(target), binding.imported, depth + 1);
}

export const typeDecl = (found: Found | null) =>
  found?.binding.kind === "type" ? found.binding.node : null;
export const varInit = (found: Found | null) =>
  found?.binding.kind === "var" ? found.binding.node : null;

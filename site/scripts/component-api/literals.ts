import { entityName, keyName, lookup, typeArgs, typeDecl, varInit } from "./source.ts";
import { isNode, type Node, type Rec } from "./types.ts";

// ========================= VARIANTS AND LITERALS

export const propOf = (obj: Node | null | undefined, name: string): Node | undefined => {
  if (obj?.type !== "ObjectExpression") return undefined;
  const prop = obj.properties?.find((p) => p.type === "Property" && keyName(p.key) === name);
  return isNode(prop?.value) ? prop.value : undefined;
};

export type Variants = { rec: Rec; config: Node };

/** The `tv({...})` config behind a variable, with the file it lives in. */
export function variantConfig(rec: Rec, name: string): Variants | null {
  const found = lookup(rec, name);
  const call = varInit(found);
  const config = call?.type === "CallExpression" ? call.arguments?.[0] : undefined;
  if (!found || config?.type !== "ObjectExpression") return null;
  return { rec: found.rec, config };
}

/** A variant's options as quoted values, or null for a true/false switch. */
export function variantValues(entry: Variants, key: string): string[] | null {
  const options = propOf(propOf(entry.config, "variants"), key);
  if (options?.type !== "ObjectExpression") return null;
  const keys = (options.properties ?? []).map((p) => keyName(p.key));
  if (keys.length === 2 && keys.includes("true") && keys.includes("false")) return null;
  return keys.map((k) => JSON.stringify(k));
}

/** The allowed values a type stands for, when it names a closed set the reader can't see. */
export function literalValues(rec: Rec, node: Node | undefined, depth = 0): string[] | null {
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

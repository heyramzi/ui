import type { Id, Snapshot } from "../types";

/** Every referential problem in a snapshot, or an empty list when it is clean. */
export function validate(snapshot: Snapshot): string[] {
  const problems: string[] = [];
  const seen = new Set<Id>();

  for (const [key, shape] of Object.entries(snapshot.shapes)) {
    if (seen.has(shape.id)) {
      problems.push(`duplicate id "${shape.id}"`);
    }
    seen.add(shape.id);
    if (key !== shape.id) {
      problems.push(`shape key "${key}" does not match id "${shape.id}"`);
    }
  }

  for (const [key, binding] of Object.entries(snapshot.bindings)) {
    if (seen.has(binding.id)) {
      problems.push(`duplicate id "${binding.id}"`);
    }
    seen.add(binding.id);
    if (key !== binding.id) {
      problems.push(`binding key "${key}" does not match id "${binding.id}"`);
    }
  }

  for (const binding of Object.values(snapshot.bindings)) {
    if (!snapshot.shapes[binding.arrowId]) {
      problems.push(`orphan binding "${binding.id}": no arrow "${binding.arrowId}"`);
    }
    if (!snapshot.shapes[binding.targetId]) {
      problems.push(`orphan binding "${binding.id}": no target "${binding.targetId}"`);
    }
  }

  for (const shape of Object.values(snapshot.shapes)) {
    if (shape.parentId && !snapshot.shapes[shape.parentId]) {
      problems.push(`shape "${shape.id}" has missing parent "${shape.parentId}"`);
    }
  }

  for (const shape of Object.values(snapshot.shapes)) {
    const path = new Set<Id>();
    let current: Id | null = shape.id;
    while (current) {
      if (path.has(current)) {
        problems.push(`parent loop through "${shape.id}"`);
        break;
      }
      path.add(current);
      current = snapshot.shapes[current]?.parentId ?? null;
    }
  }

  return problems;
}

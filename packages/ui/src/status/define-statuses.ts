import type { StatusDef, StatusId, StatusMap, Statuses } from "#src/status/status-types.js";

/**
 * Builds a status registry from a map, keeping its keys as a union so lookups stay typed:
 * `defineStatuses({ draft: { label: "Draft", tone: "neutral" } })`.
 */
export function defineStatuses<const M extends StatusMap>(
  map: M,
): Statuses & { ids: StatusId<M>[] } {
  const lookup = map as Record<string, StatusDef | undefined>;
  const find = (id: string): StatusDef | undefined => lookup[id];

  return {
    map,
    ids: Object.keys(map) as StatusId<M>[],
    has: (id) => find(id) !== undefined,
    get: find,
    label: (id) => find(id)?.label ?? id,
    tone: (id) => find(id)?.tone ?? "neutral",
    icon: (id) => find(id)?.icon,
    variant: (id) => find(id)?.variant ?? "open",
    progress: (id) => find(id)?.progress,
    color: (id) => find(id)?.color,
  };
}

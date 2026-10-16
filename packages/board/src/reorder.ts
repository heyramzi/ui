type Identifiable = { id: string };

/** Move `activeId` to `overId`'s index. Returns a copy; unknown ids pass through. */
export function reorderByIds<Item extends Identifiable>(
  items: Item[],
  activeId: Item["id"],
  overId: Item["id"],
): Item[] {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const overIndex = items.findIndex((item) => item.id === overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) {
    return items.slice();
  }

  const next = items.slice();
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return next;
}

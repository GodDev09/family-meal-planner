// Simple 1-deep undo stack per family (in-memory, same lifecycle as familyStore)
const _stack = new Map<string, unknown>();

export function pushUndo(familyId: string, menuData: unknown) {
  _stack.set(familyId, menuData);
}

export function popUndo(familyId: string): unknown | null {
  const prev = _stack.get(familyId) ?? null;
  _stack.delete(familyId);
  return prev;
}

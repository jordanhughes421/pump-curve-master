import prisma from '@/lib/prisma'; // Adjust import if your prisma client instance is located elsewhere

/**
 * Checks for cyclical dependencies for a given item and its proposed parent.
 * This function is generic and can be used for both BOMItems and StandardParts.
 *
 * @param itemId The ID of the item being moved/re-parented.
 * @param proposedParentId The ID of the proposed new parent. Null if un-parenting.
 * @param prismaDelegate The Prisma delegate for the model (e.g., prisma.bOMItem or prisma.standardPart).
 * @returns True if a cycle is detected, false otherwise.
 */
export async function detectCycle<T extends { id: number; parentId: number | null }>(
  itemId: number,
  proposedParentId: number | null,
  prismaDelegate: { findUnique: (args: any) => Promise<T | null> }
): Promise<boolean> {
  if (proposedParentId === null) {
    return false; // Cannot create a cycle by un-parenting
  }

  if (itemId === proposedParentId) {
    return true; // Item cannot be its own parent
  }

  let currentParentId: number | null = proposedParentId;
  const visitedIds = new Set<number>(); // To handle potential infinite loops in malformed data (though less likely with DB constraints)

  while (currentParentId !== null) {
    if (currentParentId === itemId) {
      return true; // Found a cycle: the item is an ancestor of its proposed parent
    }

    if (visitedIds.has(currentParentId)) {
      console.error('Cycle detected in visited IDs during parent traversal, possibly malformed data:', currentParentId);
      return true; // Safety break for already visited nodes in this path traversal
    }
    visitedIds.add(currentParentId);

    const parentItem = await prismaDelegate.findUnique({
      where: { id: currentParentId },
      select: { id: true, parentId: true }, // Select only necessary fields
    });

    if (!parentItem) {
      return false; // Parent not found, so no cycle through this path
    }
    currentParentId = parentItem.parentId;
  }

  return false; // No cycle detected
}

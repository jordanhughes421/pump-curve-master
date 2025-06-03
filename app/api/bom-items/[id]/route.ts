import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to recursively delete BOMItems and their custom fields
async function deleteBOMItemRecursive(bomItemId: number) {
  // Find children of the current item
  const children = await prisma.bOMItem.findMany({
    where: { parentId: bomItemId },
    select: { id: true }, // Only need IDs for recursion
  });

  // Recursively delete each child
  for (const child of children) {
    await deleteBOMItemRecursive(child.id);
  }

  // Delete associated BOMCustomFields for the current item
  await prisma.bOMCustomField.deleteMany({
    where: { bomItemId: bomItemId },
  });

  // After all children and their custom fields are deleted, delete the item itself
  await prisma.bOMItem.delete({
    where: { id: bomItemId },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bomItemId = parseInt(params.id);
    if (isNaN(bomItemId)) {
      return NextResponse.json({ error: 'Invalid BOM item ID' }, { status: 400 });
    }

    const data = await request.json();
    const { partNumber, description, quantity, unit, supplier, parentId } = data;

    // Basic validation
    if (!partNumber && !description && quantity === undefined && !unit && supplier === undefined && parentId === undefined) {
      return NextResponse.json(
        { error: 'No update data provided' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (partNumber !== undefined) updateData.partNumber = partNumber;
    if (description !== undefined) updateData.description = description;
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (unit !== undefined) updateData.unit = unit;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (parentId !== undefined) { // If parentId is being updated or set
        if (parentId === null) {
            updateData.parentId = null;
        } else {
            const parentIdInt = parseInt(parentId);
            if (isNaN(parentIdInt)) {
                return NextResponse.json({ error: 'Invalid parentId format' }, { status: 400 });
            }
            if (parentIdInt === bomItemId) {
                return NextResponse.json({ error: 'A BOM item cannot be its own parent' }, { status: 400 });
            }
            // Check if parent exists
            const parentBOMItem = await prisma.bOMItem.findUnique({ where: { id: parentIdInt }});
            if (!parentBOMItem) {
                return NextResponse.json({ error: 'Parent BOM item not found' }, { status: 404 });
            }
            // Potentially add check: ensure new parent is not a child of the current item to prevent circular dependencies
            updateData.parentId = parentIdInt;
        }
    }


    const updatedBOMItem = await prisma.bOMItem.update({
      where: { id: bomItemId },
      data: updateData,
      include: {
        customFields: true, // Return custom fields with the updated item
      }
    });

    return NextResponse.json(updatedBOMItem);
  } catch (error: any) {
    console.error(`Failed to update BOM item ${params.id}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'BOM item not found' }, { status: 404 });
    }
    if (error.code === 'P2002') { 
        return NextResponse.json({ error: 'Update failed due to unique constraint violation (e.g. partNumber)' }, { status: 409 });
    }
    // Add more specific error handling if parentId causes issues, e.g., P2003 foreign key constraint
    return NextResponse.json(
      { error: 'Failed to update BOM item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bomItemId = parseInt(params.id);
    if (isNaN(bomItemId)) {
      return NextResponse.json({ error: 'Invalid BOM item ID' }, { status: 400 });
    }

    // First, check if the BOM item exists before attempting deletion
    const bomItem = await prisma.bOMItem.findUnique({
      where: { id: bomItemId },
    });

    if (!bomItem) {
      return NextResponse.json(
        { error: 'BOM item not found' },
        { status: 404 }
      );
    }

    // Perform recursive deletion
    await deleteBOMItemRecursive(bomItemId);

    return NextResponse.json({ message: 'BOM item and its children deleted successfully' });
  } catch (error: any) {
    console.error(`Failed to delete BOM item ${params.id}:`, error);
    // P2025 can also occur in `delete` if the record is already gone, but we check existence first.
    // It might occur in `deleteBOMItemRecursive` if an item is deleted by another process concurrently.
    if (error.code === 'P2025') { 
      return NextResponse.json({ error: 'BOM item not found during deletion process' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete BOM item' },
      { status: 500 }
    );
  }
}

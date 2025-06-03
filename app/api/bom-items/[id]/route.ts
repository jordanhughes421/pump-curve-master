import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/bom-items/[id] - Retrieve a specific BOMItem
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
    }

    const bomItem = await prisma.bOMItem.findUnique({
      where: { id: itemId },
      include: {
        customFields: true, // Include related BOMCustomFields
        // children: true, // Optionally include children items
        // parent: true, // Optionally include parent item
      },
    });

    if (!bomItem) {
      return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
    }

    // bomItem will have bomId, but no direct pumpModelId anymore.
    // If pump information is needed, it would require an additional query:
    // const bom = await prisma.bOM.findUnique({ where: { id: bomItem.bomId }});
    // const pumpModelId = bom?.pumpModelId;
    // For now, just returning the BOMItem as requested.

    return NextResponse.json(bomItem);
  } catch (error) {
    console.error('Error fetching BOMItem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/bom-items/[id] - Update a specific BOMItem
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
    }

    const data = await request.json();
    // Explicitly destructure and type fields to update for type safety and clarity
    const {
      partNumber,
      description,
      quantity,
      unit,
      supplier,
      parentId, // Assuming parentId can be updated. Handle with care.
    }: {
      partNumber?: string;
      description?: string;
      quantity?: number;
      unit?: string;
      supplier?: string | null;
      parentId?: number | null;
    } = data;


    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'No data provided for update' }, { status: 400 });
    }
    
    // Validate parentId if provided
    if (parentId !== undefined) {
        if (parentId !== null) {
            const parentItem = await prisma.bOMItem.findUnique({ where: { id: parentId }});
            if (!parentItem) {
                 return NextResponse.json({ error: 'Parent BOMItem not found' }, { status: 400 });
            }
            // Ensure parent is not the item itself or one of its children (more complex check needed for full hierarchy protection)
            if (parentItem.id === itemId) {
                return NextResponse.json({ error: 'Cannot set item as its own parent' }, { status: 400 });
            }
            // You might also want to check if the parentItem belongs to the same BOM.
            // This requires fetching the current item to get its bomId.
            const currentItem = await prisma.bOMItem.findUnique({ where: { id: itemId }});
            if (currentItem && parentItem.bomId !== currentItem.bomId) {
                return NextResponse.json({ error: 'Parent BOMItem must belong to the same BOM' }, { status: 400 });
            }
        }
    }


    const updatedBOMItem = await prisma.bOMItem.update({
      where: { id: itemId },
      data: {
        ...(partNumber && { partNumber }),
        ...(description && { description }),
        ...(quantity !== undefined && { quantity }),
        ...(unit && { unit }),
        ...(supplier !== undefined && { supplier }),
        ...(parentId !== undefined && { parentId }),
      },
    });

    return NextResponse.json(updatedBOMItem);
  } catch (error: any) {
    console.error('Error updating BOMItem:', error);
    if (error.code === 'P2025') { // Prisma code for record to update not found
        return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
    }
    if (error.code === 'P2003' && error.meta?.field_name?.includes('parentId')) {
        return NextResponse.json({ error: 'Invalid parentId: The specified parent item does not exist or causes a conflict.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bom-items/[id] - Delete a specific BOMItem
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id, 10);
    if (isNaN(itemId)) {
      return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
    }

    // Check if item exists before attempting delete
    const bomItem = await prisma.bOMItem.findUnique({
        where: { id: itemId },
        include: { children: true } // Check for children to prevent orphaned records if not handled by DB constraints
    });

    if (!bomItem) {
        return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
    }

    // If the BOMItem has children, you might want to prevent deletion or handle children (e.g., re-parent or delete them)
    // For now, we'll assume that if a parent is deleted, its children might need to be handled.
    // A simple check:
    if (bomItem.children && bomItem.children.length > 0) {
        // Option 1: Prevent deletion
        // return NextResponse.json({ error: 'Cannot delete BOMItem with children. Please delete or re-assign children first.' }, { status: 400 });
        // Option 2: Set children's parentId to null (if schema allows)
        await prisma.bOMItem.updateMany({
            where: { parentId: itemId },
            data: { parentId: null },
        });
    }


    // Perform cascading delete within a transaction
    // 1. Delete BOMCustomFields associated with this BOMItem
    // 2. Delete the BOMItem itself
    await prisma.$transaction(async (tx) => {
      await tx.bOMCustomField.deleteMany({
        where: { bomItemId: itemId },
      });

      await tx.bOMItem.delete({
        where: { id: itemId },
      });
    });

    return NextResponse.json({ message: 'BOMItem deleted successfully' }, { status: 200 }); // or 204 No Content
  } catch (error: any) {
    console.error('Error deleting BOMItem:', error);
    if (error.code === 'P2025') { // Record to delete not found
        return NextResponse.json({ error: 'BOMItem not found or already deleted' }, { status: 404 });
    }
    // P2003 on foreign key constraint fail (e.g. if children are not handled and DB prevents deletion of parent)
    if (error.code === 'P2003') {
        return NextResponse.json({ error: 'Cannot delete this BOMItem because other records depend on it. Please handle child items first.' }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

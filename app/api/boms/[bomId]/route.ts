import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/boms/[bomId] - Get details of a specific BOM
export async function GET(
  request: Request,
  { params }: { params: { bomId: string } }
) {
  try {
    const { bomId } = params;
    const bomIdInt = parseInt(bomId, 10);

    if (isNaN(bomIdInt)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    const bom = await prisma.bOM.findUnique({
      where: { id: bomIdInt },
      include: {
        items: true, // Include related BOMItems
        customFields: true, // Include related BOMHeaderCustomFields
      },
    });

    if (!bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    return NextResponse.json(bom);
  } catch (error) {
    console.error('Error fetching BOM:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/boms/[bomId] - Update the name of a specific BOM
export async function PUT(
  request: Request,
  { params }: { params: { bomId: string } }
) {
  try {
    const { bomId } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'BOM name is required for update' }, { status: 400 });
    }

    const bomIdInt = parseInt(bomId, 10);
    if (isNaN(bomIdInt)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    // Check if BOM exists
    const existingBOM = await prisma.bOM.findUnique({ where: { id: bomIdInt } });
    if (!existingBOM) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    const updatedBOM = await prisma.bOM.update({
      where: { id: bomIdInt },
      data: { name },
    });

    return NextResponse.json(updatedBOM);
  } catch (error) {
    console.error('Error updating BOM:', error);
    // Prisma's P2025 record not found error can be caught here if needed, though the check above should handle it.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boms/[bomId] - Delete a specific BOM and its associated data
export async function DELETE(
  request: Request,
  { params }: { params: { bomId: string } }
) {
  try {
    const { bomId } = params;
    const bomIdInt = parseInt(bomId, 10);

    if (isNaN(bomIdInt)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    // Check if BOM exists before attempting delete
    const bom = await prisma.bOM.findUnique({
      where: { id: bomIdInt },
    });

    if (!bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    // Perform cascading delete within a transaction
    // 1. Delete BOMHeaderCustomFields
    // 2. Delete BOMItems (Prisma should handle BOMCustomFields associated with BOMItems if schema is set up for cascading delete)
    // 3. Delete BOM
    // Note: Prisma's default behavior for relational integrity might handle some of this,
    // but explicit deletion ensures order and clarity, especially for related data not directly cascaded by DB constraints.
    // For `BOMItem`'s `BOMCustomField`s, if `onDelete: Cascade` is not set in schema for `BOMItem` to `BOMCustomField` relation,
    // they would need to be deleted manually before deleting `BOMItem`s.
    // Assuming `BOMItem` to `BOMCustomField` has cascading delete or is handled by Prisma.

    await prisma.$transaction(async (tx) => {
      // Delete BOMHeaderCustomFields
      await tx.bOMHeaderCustomField.deleteMany({
        where: { bomId: bomIdInt },
      });

      // Delete BOMItems
      // First, we might need to delete BOMCustomFields if they don't cascade from BOMItem
      const items = await tx.bOMItem.findMany({ where: { bomId: bomIdInt }, select: { id: true } });
      const itemIds = items.map(item => item.id);

      if (itemIds.length > 0) {
        // Assuming BOMCustomField is related to BOMItem and needs to be cleaned up.
        // If your schema defines `onDelete: Cascade` for the relation from BOMItem to BOMCustomField,
        // this explicit delete of BOMCustomField might not be necessary.
        await tx.bOMCustomField.deleteMany({
          where: { bomItemId: { in: itemIds } },
        });
        
        await tx.bOMItem.deleteMany({
          where: { bomId: bomIdInt },
        });
      }

      // Delete the BOM itself
      await tx.bOM.delete({
        where: { id: bomIdInt },
      });
    });

    return NextResponse.json({ message: 'BOM deleted successfully' }, { status: 200 }); // or 204 No Content
  } catch (error) {
    console.error('Error deleting BOM:', error);
    // Handle specific Prisma errors like P2025 (record not found) if the initial check is removed
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

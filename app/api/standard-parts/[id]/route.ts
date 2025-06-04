import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { detectCycle } from '@/app/utils/cycleDetection';

// GET /api/standard-parts/[id] - Retrieve a specific StandardPart
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid StandardPart ID' }, { status: 400 });
    }

    const standardPart = await prisma.standardPart.findUnique({
      where: { id },
      include: {
        children: true, // Include children
        // parent: true, // Optionally include parent
        // bomItems: true, // Optionally include BOMItems that use this StandardPart
      },
    });

    if (!standardPart) {
      return NextResponse.json({ error: 'StandardPart not found' }, { status: 404 });
    }

    return NextResponse.json(standardPart);
  } catch (error) {
    console.error('Error fetching StandardPart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/standard-parts/[id] - Update a specific StandardPart
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid StandardPart ID' }, { status: 400 });
    }

    const data = await request.json();
    const {
      partNumber,
      description,
      defaultUnit,
      defaultSupplier,
      parentId,
    }: {
      partNumber?: string;
      description?: string;
      defaultUnit?: string;
      defaultSupplier?: string | null;
      parentId?: number | null; // Explicitly allow null for un-parenting
    } = data;

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'No data provided for update' }, { status: 400 });
    }

    // If parentId is being set or changed, check for cycles
    if (parentId !== undefined) { // parentId is explicitly part of the update
        if (parentId !== null) { // If setting a new parent (not un-parenting)
            const isCycle = await detectCycle(id, parentId, prisma.standardPart);
            if (isCycle) {
                return NextResponse.json({ error: 'Cyclical dependency detected. Cannot set this parent.' }, { status: 400 });
            }
            // Also ensure the proposed parent exists
            const parentExists = await prisma.standardPart.findUnique({ where: { id: parentId } });
            if (!parentExists) {
                return NextResponse.json({ error: 'Proposed parent StandardPart not found.' }, { status: 400 });
            }
        }
        // If parentId is null, it's an un-parenting operation, no cycle check needed.
    }


    const updatedStandardPart = await prisma.standardPart.update({
      where: { id },
      data: {
        ...(partNumber && { partNumber }),
        ...(description && { description }),
        ...(defaultUnit && { defaultUnit }),
        ...(defaultSupplier !== undefined && { defaultSupplier }), // Handle null for clearing supplier
        ...(parentId !== undefined && { parentId }), // Handle null for un-parenting
      },
    });

    return NextResponse.json(updatedStandardPart);
  } catch (error: any) {
    console.error('Error updating StandardPart:', error);
    if (error.code === 'P2025') { // Prisma code for record to update not found
      return NextResponse.json({ error: 'StandardPart not found' }, { status: 404 });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('partNumber')) {
      return NextResponse.json({ error: 'A StandardPart with this part number already exists.' }, { status: 409 });
    }
    if (error.code === 'P2003' && error.meta?.field_name?.includes('parentId')) {
        return NextResponse.json({ error: 'Invalid parentId: The specified parent StandardPart does not exist or causes a conflict.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/standard-parts/[id] - Delete a specific StandardPart
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid StandardPart ID' }, { status: 400 });
    }

    // Check if item exists before attempting delete (optional, delete will fail if not found)
    const standardPart = await prisma.standardPart.findUnique({ where: { id } });
    if (!standardPart) {
        return NextResponse.json({ error: 'StandardPart not found' }, { status: 404 });
    }

    // onDelete: Cascade in Prisma schema handles deletion of children.
    // onDelete: Restrict for BOMItems means we must check if this part is used.
    const bomItemsCount = await prisma.bOMItem.count({
        where: { standardPartId: id }
    });

    if (bomItemsCount > 0) {
        return NextResponse.json({ error: `Cannot delete StandardPart. It is currently used in ${bomItemsCount} BOMItem(s). Please remove its usages first.` }, { status: 400 });
    }


    await prisma.standardPart.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'StandardPart deleted successfully' }, { status: 200 }); // or 204 No Content
  } catch (error: any) {
    console.error('Error deleting StandardPart:', error);
    if (error.code === 'P2025') { // Record to delete not found
      return NextResponse.json({ error: 'StandardPart not found or already deleted' }, { status: 404 });
    }
    // P2003 can occur if other relations (not children, e.g. if BOMItem was SetNull instead of Restrict and not handled) prevent deletion.
    // However, with onDelete: Cascade for children and the BOMItem check above, this is less likely for this specific model.
    if (error.code === 'P2003') {
        return NextResponse.json({ error: 'Cannot delete this StandardPart because other records depend on it.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

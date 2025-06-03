import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/boms/[bomId]/custom-fields/[fieldId] - Update an existing BOMHeaderCustomField
export async function PUT(
  request: Request,
  { params }: { params: { bomId: string; fieldId: string } }
) {
  try {
    const { bomId, fieldId } = params;
    const { name, value } = await request.json();

    if (!name && value === undefined) { // At least one field must be provided for update
      return NextResponse.json({ error: 'Either name or value must be provided for update' }, { status: 400 });
    }

    const bomIdInt = parseInt(bomId, 10);
    const fieldIdInt = parseInt(fieldId, 10);

    if (isNaN(bomIdInt) || isNaN(fieldIdInt)) {
      return NextResponse.json({ error: 'Invalid BOM ID or Field ID' }, { status: 400 });
    }

    // Check if the BOMHeaderCustomField exists and belongs to the specified BOM
    const existingField = await prisma.bOMHeaderCustomField.findUnique({
      where: { id: fieldIdInt },
    });

    if (!existingField) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    if (existingField.bomId !== bomIdInt) {
      return NextResponse.json({ error: 'Custom field does not belong to the specified BOM' }, { status: 403 });
    }

    const updatedField = await prisma.bOMHeaderCustomField.update({
      where: {
        id: fieldIdInt,
        // bomId: bomIdInt, // Ensures the field belongs to the bomId - good for extra safety
      },
      data: {
        ...(name && { name }),
        ...(value !== undefined && { value }), // Allow updating value to an empty string
      },
    });

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error('Error updating BOMHeaderCustomField:', error);
    // Prisma's P2025 can be caught if the findUnique check is removed
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/boms/[bomId]/custom-fields/[fieldId] - Delete a BOMHeaderCustomField
export async function DELETE(
  request: Request,
  { params }: { params: { bomId: string; fieldId: string } }
) {
  try {
    const { bomId, fieldId } = params;
    const bomIdInt = parseInt(bomId, 10);
    const fieldIdInt = parseInt(fieldId, 10);

    if (isNaN(bomIdInt) || isNaN(fieldIdInt)) {
      return NextResponse.json({ error: 'Invalid BOM ID or Field ID' }, { status: 400 });
    }

    // Check if the BOMHeaderCustomField exists and belongs to the specified BOM before deleting
    const fieldToDelete = await prisma.bOMHeaderCustomField.findUnique({
      where: { id: fieldIdInt },
    });

    if (!fieldToDelete) {
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }

    if (fieldToDelete.bomId !== bomIdInt) {
      // This check ensures that one cannot delete a field using a bomId it doesn't belong to.
      return NextResponse.json({ error: 'Custom field does not belong to the specified BOM or not found' }, { status: 404 }); // Or 403 Forbidden
    }

    await prisma.bOMHeaderCustomField.delete({
      where: {
        id: fieldIdInt,
        // bomId: bomIdInt, // Can also be included here
      },
    });

    return NextResponse.json({ message: 'BOM Header Custom Field deleted successfully' }, { status: 200 }); // or 204 No Content
  } catch (error) {
    console.error('Error deleting BOMHeaderCustomField:', error);
     // Handle specific Prisma errors like P2025 (record not found) if the initial check is removed
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

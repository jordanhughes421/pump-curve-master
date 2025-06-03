import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { fieldId: string } }
) {
  try {
    const fieldId = parseInt(params.fieldId);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: 'Invalid custom field ID' }, { status: 400 });
    }

    const data = await request.json();
    const { name, value } = data;

    if (name === undefined && value === undefined) {
      return NextResponse.json(
        { error: 'No update data provided (name or value required)' },
        { status: 400 }
      );
    }
    
    const updateData: { name?: string; value?: string } = {};
    if (name !== undefined) {
        if (name.trim() === '') return NextResponse.json({ error: 'Custom field name cannot be empty' }, { status: 400 });
        updateData.name = name;
    }
    if (value !== undefined) {
        updateData.value = value;
    }

    const updatedCustomField = await prisma.bOMCustomField.update({
      where: { id: fieldId },
      data: updateData,
    });

    return NextResponse.json(updatedCustomField);
  } catch (error: any) {
    console.error(`Failed to update custom field ${params.fieldId}:`, error);
    if (error.code === 'P2025') { // Prisma error code for record not found
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }
    // Example: Handle if a custom field with the same name should be unique per BOMItem (requires schema adjustment & different logic)
    // if (error.code === 'P2002') { 
    //   return NextResponse.json({ error: 'Update failed due to unique constraint violation.' }, { status: 409 });
    // }
    return NextResponse.json(
      { error: 'Failed to update custom field' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { fieldId: string } }
) {
  try {
    const fieldId = parseInt(params.fieldId);
    if (isNaN(fieldId)) {
      return NextResponse.json({ error: 'Invalid custom field ID' }, { status: 400 });
    }

    // Check if the custom field exists before attempting deletion
    // This helps provide a clearer 404 than relying solely on P2025 from the delete operation itself.
    const customField = await prisma.bOMCustomField.findUnique({
        where: { id: fieldId },
    });

    if (!customField) {
        return NextResponse.json(
            { error: 'Custom field not found' },
            { status: 404 }
        );
    }

    await prisma.bOMCustomField.delete({
      where: { id: fieldId },
    });

    return NextResponse.json({ message: 'Custom field deleted successfully' });
  } catch (error: any) {
    console.error(`Failed to delete custom field ${params.fieldId}:`, error);
    if (error.code === 'P2025') {
      // This might still be caught if the field is deleted between the findUnique check and the delete operation
      return NextResponse.json({ error: 'Custom field not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete custom field' },
      { status: 500 }
    );
  }
}

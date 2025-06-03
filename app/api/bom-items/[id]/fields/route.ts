import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bomItemId = parseInt(params.id);
    if (isNaN(bomItemId)) {
      return NextResponse.json({ error: 'Invalid BOM item ID' }, { status: 400 });
    }

    // Check if the BOMItem exists
    const bomItem = await prisma.bOMItem.findUnique({
      where: { id: bomItemId },
    });

    if (!bomItem) {
      return NextResponse.json(
        { error: 'BOM item not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const { name, value } = data;

    if (!name || name.trim() === '' || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required custom field data: name and value' },
        { status: 400 }
      );
    }

    const newCustomField = await prisma.bOMCustomField.create({
      data: {
        name,
        value,
        bomItemId: bomItemId,
      },
    });

    return NextResponse.json(newCustomField, { status: 201 });
  } catch (error: any) {
    console.error(`Failed to add custom field to BOM item ${params.id}:`, error);
    // Example: Handle if a custom field with the same name should be unique per BOMItem (requires schema adjustment)
    // if (error.code === 'P2002') { 
    //   return NextResponse.json({ error: 'Custom field with this name already exists for this BOM item.' }, { status: 409 });
    // }
    return NextResponse.json(
      { error: 'Failed to add custom field' },
      { status: 500 }
    );
  }
}

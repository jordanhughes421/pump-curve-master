import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/boms/[bomId]/custom-fields - Add a new BOMHeaderCustomField to a BOM
export async function POST(
  request: Request,
  { params }: { params: { bomId: string } }
) {
  try {
    const { bomId } = params;
    const { name, value } = await request.json();

    if (!name || value === undefined || value === null) { // value can be an empty string
      return NextResponse.json({ error: 'Custom field name and value are required' }, { status: 400 });
    }

    const bomIdInt = parseInt(bomId, 10);
    if (isNaN(bomIdInt)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    // Check if BOM exists
    const bom = await prisma.bOM.findUnique({
      where: { id: bomIdInt },
    });

    if (!bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    const newCustomField = await prisma.bOMHeaderCustomField.create({
      data: {
        name,
        value,
        bomId: bomIdInt,
      },
    });

    return NextResponse.json(newCustomField, { status: 201 });
  } catch (error) {
    console.error('Error creating BOMHeaderCustomField:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

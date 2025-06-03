import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/bom-items/[id]/custom-fields - Add a new BOMCustomField to a BOMItem
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { name, value } = await request.json();

    if (!name || value === undefined || value === null) { // value can be an empty string
      return NextResponse.json({ error: 'Custom field name and value are required' }, { status: 400 });
    }

    const idInt = parseInt(id, 10);
    if (isNaN(idInt)) {
      return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
    }

    // Check if BOMItem exists
    const bomItem = await prisma.bOMItem.findUnique({
      where: { id: idInt },
    });

    if (!bomItem) {
      return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
    }

    const newCustomField = await prisma.bOMCustomField.create({
      data: {
        name,
        value,
        bomItemId: idInt,
      },
    });

    return NextResponse.json(newCustomField, { status: 201 });
  } catch (error) {
    console.error('Error creating BOMCustomField:', error);
    // P2003 can happen if id is invalid, though the check above should catch it.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bom-items/[id]/custom-fields - List all custom fields for a BOMItem
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const idInt = parseInt(id, 10);

        if (isNaN(idInt)) {
            return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
        }

        const bomItem = await prisma.bOMItem.findUnique({
            where: { id: idInt },
        });

        if (!bomItem) {
            return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
        }

        const customFields = await prisma.bOMCustomField.findMany({
            where: {
                bomItemId: idInt,
            },
            orderBy: {
                createdAt: 'asc',
            }
        });

        return NextResponse.json(customFields);
    } catch (error) {
        console.error('Error fetching BOMCustomFields:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

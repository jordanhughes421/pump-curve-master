import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/bom-items/[bomItemId]/custom-fields - Add a new BOMCustomField to a BOMItem
export async function POST(
  request: Request,
  { params }: { params: { bomItemId: string } }
) {
  try {
    const { bomItemId } = params;
    const { name, value } = await request.json();

    if (!name || value === undefined || value === null) { // value can be an empty string
      return NextResponse.json({ error: 'Custom field name and value are required' }, { status: 400 });
    }

    const bomItemIdInt = parseInt(bomItemId, 10);
    if (isNaN(bomItemIdInt)) {
      return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
    }

    // Check if BOMItem exists
    const bomItem = await prisma.bOMItem.findUnique({
      where: { id: bomItemIdInt },
    });

    if (!bomItem) {
      return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
    }

    const newCustomField = await prisma.bOMCustomField.create({
      data: {
        name,
        value,
        bomItemId: bomItemIdInt,
      },
    });

    return NextResponse.json(newCustomField, { status: 201 });
  } catch (error) {
    console.error('Error creating BOMCustomField:', error);
    // P2003 can happen if bomItemId is invalid, though the check above should catch it.
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bom-items/[bomItemId]/custom-fields - List all custom fields for a BOMItem
export async function GET(
    request: Request,
    { params }: { params: { bomItemId: string } }
) {
    try {
        const { bomItemId } = params;
        const bomItemIdInt = parseInt(bomItemId, 10);

        if (isNaN(bomItemIdInt)) {
            return NextResponse.json({ error: 'Invalid BOMItem ID' }, { status: 400 });
        }

        const bomItem = await prisma.bOMItem.findUnique({
            where: { id: bomItemIdInt },
        });

        if (!bomItem) {
            return NextResponse.json({ error: 'BOMItem not found' }, { status: 404 });
        }

        const customFields = await prisma.bOMCustomField.findMany({
            where: {
                bomItemId: bomItemIdInt,
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

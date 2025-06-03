import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/boms/[bomId]/items - Add a new BOMItem to a BOM
export async function POST(
  request: Request,
  { params }: { params: { bomId: string } }
) {
  try {
    const { bomId } = params;
    const body = await request.json();
    const { partNumber, description, quantity, unit, supplier, parentId } = body;

    if (!partNumber || !description || quantity === undefined || !unit) {
      return NextResponse.json({ error: 'Missing required BOMItem fields (partNumber, description, quantity, unit)' }, { status: 400 });
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

    // Validate parentId if provided
    let parentIdInt: number | null = null;
    if (parentId !== undefined && parentId !== null) {
      parentIdInt = parseInt(parentId as string, 10);
      if (isNaN(parentIdInt)) {
        return NextResponse.json({ error: 'Invalid parentId format' }, { status: 400 });
      }
      // Check if parent BOMItem exists and belongs to the same BOM
      const parentItem = await prisma.bOMItem.findUnique({
        where: { id: parentIdInt },
      });
      if (!parentItem || parentItem.bomId !== bomIdInt) {
        return NextResponse.json({ error: 'Parent BOMItem not found or does not belong to this BOM' }, { status: 400 });
      }
    }

    const newBOMItem = await prisma.bOMItem.create({
      data: {
        bomId: bomIdInt,
        partNumber,
        description,
        quantity: parseInt(quantity as string, 10), // Ensure quantity is an Int
        unit,
        supplier: supplier || null,
        parentId: parentIdInt,
      },
    });

    return NextResponse.json(newBOMItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating BOMItem:', error);
    if (error.code === 'P2003' && error.meta?.field_name === 'BOMItem_parentId_fkey (index)') {
        return NextResponse.json({ error: 'Invalid parentId: The specified parent item does not exist.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
